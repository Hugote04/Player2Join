import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessagingService, Conversation } from '../../../core/services/messaging.service';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './conversations.component.scss',
  template: `
    <section class="conversations-page">
      <header class="conv-header">
        <h1>💬 Mensajes</h1>
        <p class="conv-subtitle">Conversaciones con jugadores que sigues y te siguen</p>
      </header>

      @if (loading()) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Cargando conversaciones...</p>
        </div>
      }

      @if (!loading() && conversations().length === 0) {
        <div class="empty">
          <p>No tienes conversaciones todavía.</p>
          <p class="empty-hint">Visita el perfil de un jugador que te siga y síguelo para poder enviarle mensajes.</p>
          <a routerLink="/buscar" class="btn-explore">🔍 Buscar jugadores</a>
        </div>
      }

      @if (!loading() && conversations().length > 0) {
        <div class="conv-list">
          @for (convo of conversations(); track convo.id) {
            <a [routerLink]="['/chat', getOtherUid(convo)]" class="conv-card">
              <div class="conv-avatar">
                @if (getProfile(convo)?.photoURL) {
                  <img [src]="getProfile(convo)!.photoURL" alt="" />
                } @else {
                  <span class="avatar-fallback">{{ (getProfile(convo)?.username ?? '?').charAt(0).toUpperCase() }}</span>
                }
              </div>
              <div class="conv-info">
                <h3 class="conv-name">{{ getProfile(convo)?.username ?? 'Jugador' }}</h3>
                <p class="conv-preview">{{ convo.lastMessage }}</p>
              </div>
              <span class="conv-time">{{ timeAgo(convo.lastMessageAt) }}</span>
            </a>
          }
        </div>
      }
    </section>
  `
})
export class ConversationsComponent implements OnInit {
  private messagingService = inject(MessagingService);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  conversations = signal<Conversation[]>([]);
  loading = signal(true);
  profileMap = signal<Record<string, UserProfile>>({});

  async ngOnInit() {
    try {
      const convos = await this.messagingService.loadMyConversations();
      this.conversations.set(convos);

      const myUid = this.authService.currentUserSig()?.uid ?? '';
      for (const convo of convos) {
        const otherUid = convo.participants.find(p => p !== myUid) ?? '';
        if (otherUid && !this.profileMap()[otherUid]) {
          const prof = await this.profileService.getPublicProfile(otherUid);
          if (prof) {
            this.profileMap.update(m => ({ ...m, [otherUid]: prof }));
          }
        }
      }
    } finally {
      this.loading.set(false);
    }
  }

  getOtherUid(convo: Conversation): string {
    const myUid = this.authService.currentUserSig()?.uid ?? '';
    return convo.participants.find(p => p !== myUid) ?? '';
  }

  getProfile(convo: Conversation): UserProfile | undefined {
    return this.profileMap()[this.getOtherUid(convo)];
  }

  timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
}
