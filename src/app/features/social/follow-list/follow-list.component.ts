import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SocialService } from '../../../core/services/social.service';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-follow-list',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './follow-list.component.scss',
  template: `
    <section class="follow-list-page">
      <!-- Header -->
      <header class="list-header">
        <a [routerLink]="backLink()" class="btn-back">←</a>
        <div>
          <h1>{{ title() }}</h1>
          <p class="list-subtitle">{{ ownerName() }}</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Cargando...</p>
        </div>
      }

      @if (!loading() && users().length === 0) {
        <div class="empty">
          <p>{{ emptyMsg() }}</p>
        </div>
      }

      @if (!loading() && users().length > 0) {
        <div class="users-list">
          @for (user of users(); track user.uid) {
            <a [routerLink]="['/usuario', user.uid]" class="user-card">
              <div class="user-card__avatar">
                @if (user.photoURL) {
                  <img [src]="user.photoURL" [alt]="user.username" />
                } @else {
                  <span class="avatar-fallback">{{ user.username.charAt(0).toUpperCase() }}</span>
                }
              </div>
              <div class="user-card__info">
                <h3 class="user-card__name">{{ user.username }}</h3>
                @if (user.description) {
                  <p class="user-card__desc">{{ user.description }}</p>
                }
              </div>
              <span class="user-card__arrow">→</span>
            </a>
          }
        </div>
      }
    </section>
  `
})
export class FollowListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private socialService = inject(SocialService);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  users = signal<UserProfile[]>([]);
  loading = signal(true);
  title = signal('');
  ownerName = signal('');
  emptyMsg = signal('');
  backLink = signal('/buscar');

  private targetUid = '';
  private mode: 'followers' | 'following' = 'followers';

  async ngOnInit() {
    this.targetUid = this.route.snapshot.paramMap.get('uid') ?? '';
    this.mode = this.route.snapshot.data['mode'] ?? 'followers';

    if (!this.targetUid) {
      this.loading.set(false);
      return;
    }

    this.backLink.set(`/usuario/${this.targetUid}`);

    // Cargar nombre del dueño del perfil
    const currentUid = this.authService.currentUserSig()?.uid;
    if (this.targetUid === currentUid) {
      const myProf = this.profileService.profileSig();
      this.ownerName.set(myProf?.username ?? 'Mi perfil');
    } else {
      const prof = await this.profileService.getPublicProfile(this.targetUid);
      this.ownerName.set(prof?.username ?? 'Usuario');
    }

    if (this.mode === 'followers') {
      this.title.set('Seguidores');
      this.emptyMsg.set('Aún no tiene seguidores');
    } else {
      this.title.set('Siguiendo');
      this.emptyMsg.set('Aún no sigue a nadie');
    }

    try {
      const list = this.mode === 'followers'
        ? await this.socialService.getFollowers(this.targetUid)
        : await this.socialService.getFollowing(this.targetUid);
      this.users.set(list);
    } catch {
      this.users.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
