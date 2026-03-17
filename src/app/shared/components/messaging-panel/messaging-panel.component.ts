import {
  Component, inject, signal, computed, effect,
  viewChild, ElementRef, OnDestroy
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MessagingService, Conversation } from '../../../core/services/messaging.service';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { SocialService } from '../../../core/services/social.service';
import { CollectionService, SavedGame } from '../../../core/services/collection.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-messaging-panel',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  styleUrl: './messaging-panel.component.scss',
  template: `
    @if (authService.currentUserSig()) {
      <!-- Tab cerrada -->
      @if (!msgSvc.panelOpen()) {
        <button class="dm-tab" (click)="msgSvc.openPanel()">💬 Mensajes</button>
      }

      <!-- Panel abierto -->
      @if (msgSvc.panelOpen()) {
        <div class="dm-panel">
          <!-- Header -->
          <div class="dm-header">
            @if (view() === 'chat') {
              <button class="dm-hdr-btn" (click)="backToList()">←</button>
              <div class="dm-hdr-user">
                @if (chatProfile()?.photoURL) {
                  <img [src]="chatProfile()!.photoURL" class="dm-hdr-av" />
                }
                <span>{{ chatProfile()?.username ?? 'Chat' }}</span>
              </div>
            } @else {
              <span class="dm-hdr-title">💬 Mensajes</span>
            }
            <button class="dm-hdr-btn dm-close" (click)="closePanel()">✕</button>
          </div>

          <!-- === LISTA DE CONVERSACIONES === -->
          @if (view() === 'list') {
            <div class="dm-body">
              @if (listLoading()) {
                <div class="dm-center"><div class="dm-spinner"></div></div>
              } @else if (conversations().length === 0) {
                <div class="dm-center">
                  <p>Sin conversaciones aún</p>
                  <p class="dm-hint">Sigue a otros jugadores y que te sigan para chatear</p>
                </div>
              } @else {
                @for (convo of conversations(); track convo.id) {
                  <button class="dm-conv" (click)="selectChat(getOtherUid(convo))">
                    <div class="dm-av">
                      @if (getProfile(convo)?.photoURL) {
                        <img [src]="getProfile(convo)!.photoURL" />
                      } @else {
                        <span>{{ (getProfile(convo)?.username ?? '?').charAt(0).toUpperCase() }}</span>
                      }
                    </div>
                    <div class="dm-conv-info">
                      <span class="dm-conv-name">{{ getProfile(convo)?.username ?? 'Jugador' }}</span>
                      <span class="dm-conv-preview">{{ convo.lastMessage }}</span>
                    </div>
                    <span class="dm-conv-time">{{ timeAgo(convo.lastMessageAt) }}</span>
                  </button>
                }
              }
            </div>
          }

          <!-- === CHAT === -->
          @if (view() === 'chat') {
            @if (chatLoading()) {
              <div class="dm-body"><div class="dm-center"><div class="dm-spinner"></div></div></div>
            } @else if (!chatProfile()) {
              <div class="dm-body"><div class="dm-center"><p>Usuario no encontrado</p></div></div>
            } @else {
              @if (!isMutual()) {
                <div class="dm-warn">⚠️ Debéis seguiros mutuamente para chatear</div>
              }

              <div class="dm-messages" #panelMessages>
                @if (msgSvc.messages().length === 0 && isMutual()) {
                  <div class="dm-center dm-first-msg">👋 ¡Envía el primer mensaje!</div>
                }
                @for (msg of msgSvc.messages(); track msg.id) {
                  <div class="dm-msg" [class.sent]="msg.senderId === myUid" [class.received]="msg.senderId !== myUid">
                    <div class="dm-bubble">
                      @if (msg.type === 'text') {
                        <p>{{ msg.content }}</p>
                      } @else if (msg.type === 'image' || msg.type === 'gif') {
                        <img [src]="msg.content" class="dm-msg-img" loading="lazy" />
                      } @else if (msg.type === 'game' && msg.gameData) {
                        <a [routerLink]="['/game', msg.gameData.id]" class="dm-game-link" (click)="closePanel()">
                          🎮 {{ msg.gameData.name }} ({{ msg.gameData.rating | number:'1.1-1' }}⭐)
                        </a>
                      }
                      <span class="dm-time">{{ formatTime(msg.createdAt) }}</span>
                    </div>
                  </div>
                }
              </div>

              @if (isMutual()) {
                <div class="dm-input-area">
                  @if (showAttach()) {
                    <div class="dm-attach-dropdown">
                      <button (click)="setImgMode('url')">🔗 Imagen / GIF</button>
                      <button (click)="setImgMode('file')">📁 Subir archivo</button>
                      <button (click)="openGames()">🎮 Compartir juego</button>
                    </div>
                  }

                  @if (imageMode() === 'url') {
                    <div class="dm-extra-row">
                      <input type="url" [(ngModel)]="imageUrl" placeholder="URL de imagen o GIF..." (keydown.enter)="sendImage()" />
                      <button (click)="sendImage()" [disabled]="!imageUrl.trim()">↑</button>
                      <button (click)="imageMode.set('none')">✕</button>
                    </div>
                  }

                  @if (imageMode() === 'file') {
                    <div class="dm-extra-row">
                      <input #fileInput type="file" accept="image/*" class="dm-file-hidden" (change)="onFile($event)" />
                      <button (click)="fileInput.click()">📁 Elegir</button>
                      <button (click)="imageMode.set('none'); filePreview.set(null)">✕</button>
                    </div>
                    @if (filePreview()) {
                      <div class="dm-preview">
                        <img [src]="filePreview()" />
                        <button (click)="sendFileImg()" [disabled]="sending()">Enviar</button>
                      </div>
                    }
                  }

                  <div class="dm-text-row">
                    <button class="dm-att-btn" (click)="toggleAttach()">📎</button>
                    <input [(ngModel)]="messageText" (keydown.enter)="sendText()" placeholder="Escribe un mensaje..." [disabled]="sending()" />
                    <button class="dm-send-btn" (click)="sendText()" [disabled]="!messageText.trim() || sending()">➤</button>
                  </div>
                </div>
              }
            }
          }
        </div>

        <!-- Game picker overlay -->
        @if (showGames()) {
          <div class="dm-games-overlay" (click)="showGames.set(false)">
            <div class="dm-games-box" (click)="$event.stopPropagation()">
              <div class="dm-games-hdr">
                <span>🎮 Tu colección</span>
                <button (click)="showGames.set(false)">✕</button>
              </div>
              <div class="dm-games-grid">
                @if (myGames().length === 0) {
                  <p class="dm-center">No tienes juegos en tu colección</p>
                }
                @for (game of myGames(); track game.id) {
                  <button class="dm-game-item" (click)="sendGame(game)">
                    <div class="dm-game-thumb" [style.backgroundImage]="'url(' + game.background_image + ')'"></div>
                    <span>{{ game.name }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        }
      }
    }
  `
})
export class MessagingPanelComponent implements OnDestroy {
  authService = inject(AuthService);
  msgSvc = inject(MessagingService);
  private profileService = inject(ProfileService);
  private socialService = inject(SocialService);
  private collectionService = inject(CollectionService);
  private toast = inject(ToastService);

  // Vista actual (derivada del estado del servicio)
  view = computed(() => this.msgSvc.activeChatUid() ? 'chat' as const : 'list' as const);

  // === Conversation list state ===
  conversations = signal<Conversation[]>([]);
  profileMap = signal<Record<string, UserProfile>>({});
  listLoading = signal(false);

  // === Chat state ===
  chatProfile = signal<UserProfile | null>(null);
  isMutual = signal(false);
  chatLoading = signal(false);
  sending = signal(false);
  conversationId = '';
  myUid = '';

  // === Input state ===
  messageText = '';
  imageMode = signal<'none' | 'url' | 'file'>('none');
  imageUrl = '';
  filePreview = signal<string | null>(null);
  showAttach = signal(false);
  showGames = signal(false);
  myGames = signal<SavedGame[]>([]);

  // Auto-scroll
  messagesEl = viewChild<ElementRef>('panelMessages');

  constructor() {
    // Reaccionar a cambios del panel (open/close, chat/list)
    effect(() => {
      const open = this.msgSvc.panelOpen();
      const uid = this.msgSvc.activeChatUid();
      if (!open) return;
      // Desacoplar del efecto para evitar restricciones de escritura
      setTimeout(() => {
        if (uid) this.loadChat(uid);
        else this.loadConversations();
      });
    });

    // Auto-scroll cuando llegan mensajes nuevos
    effect(() => {
      this.msgSvc.messages();
      setTimeout(() => {
        const el = this.messagesEl()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }, 80);
    });

    // Sincronizar lista de conversaciones en tiempo real + cargar perfiles nuevos
    effect(() => {
      const convos = this.msgSvc.conversations();
      this.conversations.set(convos);
      const uid = this.authService.currentUserSig()?.uid ?? '';
      for (const c of convos) {
        const otherUid = c.participants.find(p => p !== uid) ?? '';
        if (otherUid && !this.profileMap()[otherUid]) {
          this.profileService.getPublicProfile(otherUid).then(prof => {
            if (prof) this.profileMap.update(m => ({ ...m, [otherUid]: prof }));
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this.msgSvc.stopMessages();
    this.msgSvc.stopConversations();
  }

  // ==============================
  // CONVERSACIONES
  // ==============================
  async loadConversations() {
    this.listLoading.set(true);
    this.myUid = this.authService.currentUserSig()?.uid ?? '';
    try {
      // Carga inicial para mostrar datos rápido
      await this.msgSvc.loadMyConversations();
    } finally {
      this.listLoading.set(false);
    }
    // Arrancar listener en tiempo real (el effect del constructor sincroniza el signal)
    this.msgSvc.listenMyConversations();
  }

  getOtherUid(convo: Conversation): string {
    return convo.participants.find(p => p !== this.myUid) ?? '';
  }

  getProfile(convo: Conversation): UserProfile | undefined {
    return this.profileMap()[this.getOtherUid(convo)];
  }

  selectChat(uid: string) {
    this.msgSvc.activeChatUid.set(uid);
  }

  backToList() {
    this.msgSvc.stopMessages();
    this.resetChatState();
    this.msgSvc.activeChatUid.set('');
  }

  closePanel() {
    this.resetChatState();
    this.msgSvc.closePanel();
  }

  private resetChatState() {
    this.chatProfile.set(null);
    this.isMutual.set(false);
    this.messageText = '';
    this.imageMode.set('none');
    this.imageUrl = '';
    this.filePreview.set(null);
    this.showAttach.set(false);
    this.showGames.set(false);
  }

  // ==============================
  // CHAT
  // ==============================
  async loadChat(uid: string) {
    this.chatLoading.set(true);
    this.msgSvc.stopMessages();
    this.resetChatState();
    this.myUid = this.authService.currentUserSig()?.uid ?? '';

    try {
      const prof = await this.profileService.getPublicProfile(uid);
      this.chatProfile.set(prof);
      if (!prof) return;

      const mutual = await this.socialService.areMutualFollowers(this.myUid, uid);
      this.isMutual.set(mutual);

      this.conversationId = this.msgSvc.getConversationId(this.myUid, uid);

      if (mutual) {
        try { await this.msgSvc.getOrCreateConversation(uid); } catch { /* se creará al enviar */ }
      }

      this.msgSvc.listenMessages(this.conversationId);
    } catch {
      this.chatProfile.set(null);
    } finally {
      this.chatLoading.set(false);
    }
  }

  // ==============================
  // ENVIAR MENSAJES
  // ==============================
  async sendText() {
    const text = this.messageText.trim();
    if (!text || !this.conversationId) return;
    this.sending.set(true);
    this.messageText = '';
    try {
      await this.msgSvc.sendMessage(this.conversationId, { type: 'text', content: text });
    } catch {
      this.toast.error('Error al enviar');
    } finally {
      this.sending.set(false);
    }
  }

  toggleAttach() { this.showAttach.update(v => !v); }

  setImgMode(mode: 'url' | 'file') {
    this.imageMode.set(mode);
    this.showAttach.set(false);
    this.imageUrl = '';
    this.filePreview.set(null);
  }

  async sendImage() {
    const url = this.imageUrl.trim();
    if (!url || !this.conversationId) return;
    this.sending.set(true);
    const isGif = url.toLowerCase().includes('.gif');
    try {
      await this.msgSvc.sendMessage(this.conversationId, { type: isGif ? 'gif' : 'image', content: url });
      this.imageUrl = '';
      this.imageMode.set('none');
    } catch {
      this.toast.error('Error al enviar');
    } finally {
      this.sending.set(false);
    }
  }

  onFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { this.toast.error('Máximo 500 KB'); return; }
    const reader = new FileReader();
    reader.onload = () => this.filePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  async sendFileImg() {
    const data = this.filePreview();
    if (!data || !this.conversationId) return;
    this.sending.set(true);
    const isGif = data.includes('image/gif');
    try {
      await this.msgSvc.sendMessage(this.conversationId, { type: isGif ? 'gif' : 'image', content: data });
      this.filePreview.set(null);
      this.imageMode.set('none');
    } catch {
      this.toast.error('Error al enviar');
    } finally {
      this.sending.set(false);
    }
  }

  async openGames() {
    this.showAttach.set(false);
    const games = await this.collectionService.loadUserCollection();
    this.myGames.set(games);
    this.showGames.set(true);
  }

  async sendGame(game: SavedGame) {
    if (!this.conversationId) return;
    this.sending.set(true);
    try {
      await this.msgSvc.sendMessage(this.conversationId, {
        type: 'game', content: '',
        gameData: { id: game.id, name: game.name, background_image: game.background_image, rating: game.rating },
      });
      this.showGames.set(false);
      this.toast.success(`"${game.name}" compartido`);
    } catch {
      this.toast.error('Error al compartir');
    } finally {
      this.sending.set(false);
    }
  }

  // ==============================
  // UTILIDADES
  // ==============================
  timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
