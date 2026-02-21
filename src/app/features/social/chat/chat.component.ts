import {
  Component, inject, OnInit, OnDestroy, signal,
  computed, effect, viewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MessagingService } from '../../../core/services/messaging.service';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { SocialService } from '../../../core/services/social.service';
import { CollectionService, SavedGame } from '../../../core/services/collection.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  styleUrl: './chat.component.scss',
  template: `
    <section class="chat-page">
      @if (loading()) {
        <div class="loader"><div class="spinner"></div><p>Cargando chat...</p></div>
      }

      @if (!loading() && !otherProfile()) {
        <div class="error-state">
          <p>Usuario no encontrado.</p>
          <a routerLink="/mensajes" class="btn-back-link">← Volver a mensajes</a>
        </div>
      }

      @if (!loading() && otherProfile()) {
        <!-- Header -->
        <header class="chat-header">
          <a routerLink="/mensajes" class="btn-back">←</a>
          <a [routerLink]="['/usuario', otherUid]" class="chat-user-link">
            <div class="chat-avatar">
              @if (otherProfile()!.photoURL) {
                <img [src]="otherProfile()!.photoURL" alt="" />
              } @else {
                <span class="avatar-fallback">{{ otherProfile()!.username.charAt(0).toUpperCase() }}</span>
              }
            </div>
            <div class="chat-user-info">
              <h2>{{ otherProfile()!.username }}</h2>
              @if (otherProfile()!.twitterHandle) {
                <span class="twitter-tag">𝕏 &#64;{{ otherProfile()!.twitterHandle }}</span>
              }
            </div>
          </a>
        </header>

        <!-- No mutual follow warning -->
        @if (!isMutualFollow()) {
          <div class="mutual-warning">
            <p>⚠️ Debéis seguiros mutuamente para poder enviar mensajes.</p>
            <a [routerLink]="['/usuario', otherUid]" class="btn-follow-link">Ver perfil →</a>
          </div>
        }

        <!-- Messages -->
        <div class="messages-container" #messagesContainer>
          @if (messagingService.messages().length === 0 && isMutualFollow()) {
            <div class="empty-chat">
              <p>👋 ¡Envía el primer mensaje!</p>
            </div>
          }

          @for (msg of messagingService.messages(); track msg.id) {
            <div class="message" [class.sent]="msg.senderId === myUid" [class.received]="msg.senderId !== myUid">
              <div class="msg-bubble">
                @if (msg.type === 'text') {
                  <p class="msg-text">{{ msg.content }}</p>
                } @else if (msg.type === 'image' || msg.type === 'gif') {
                  <img [src]="msg.content" class="msg-image" alt="Imagen" loading="lazy" />
                } @else if (msg.type === 'game' && msg.gameData) {
                  <a [routerLink]="['/game', msg.gameData.id]" class="msg-game-card">
                    <div class="msg-game-img" [style.backgroundImage]="'url(' + msg.gameData.background_image + ')'">
                      <span class="msg-game-rating">⭐ {{ msg.gameData.rating | number:'1.1-1' }}</span>
                    </div>
                    <span class="msg-game-name">🎮 {{ msg.gameData.name }}</span>
                  </a>
                }
                <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          }
          <div #messagesEnd></div>
        </div>

        <!-- Input area (solo si mutuos) -->
        @if (isMutualFollow()) {
          <div class="chat-input-area">
            <!-- Toolbar -->
            <div class="input-toolbar">
              <button class="btn-attach" (click)="toggleAttachMenu()" title="Adjuntar">📎</button>

              @if (showAttachMenu()) {
                <div class="attach-menu">
                  <button (click)="selectImageMode('url')">🔗 Imagen / GIF por URL</button>
                  <button (click)="selectImageMode('file')">📁 Subir imagen local</button>
                  <button (click)="openGamePicker()">🎮 Compartir juego</button>
                </div>
              }
            </div>

            <!-- Image URL bar -->
            @if (imageMode() === 'url') {
              <div class="url-bar">
                <input
                  type="url"
                  placeholder="Pega la URL de la imagen o GIF..."
                  [(ngModel)]="imageUrl"
                  (keydown.enter)="sendImage()"
                />
                <button class="btn-send-img" (click)="sendImage()" [disabled]="!imageUrl.trim()">Enviar</button>
                <button class="btn-close-bar" (click)="imageMode.set('none')">✕</button>
              </div>
            }

            <!-- File upload -->
            @if (imageMode() === 'file') {
              <div class="file-bar">
                <input #fileInput type="file" accept="image/*" class="file-hidden" (change)="onFileSelected($event)" />
                <button class="btn-pick-file" (click)="fileInput.click()">📁 Seleccionar imagen</button>
                <button class="btn-close-bar" (click)="imageMode.set('none'); filePreview.set(null)">✕</button>
              </div>
              @if (filePreview()) {
                <div class="file-preview">
                  <img [src]="filePreview()" alt="Preview" />
                  <button class="btn-send-img" (click)="sendFileImage()" [disabled]="sending()">Enviar imagen</button>
                </div>
              }
            }

            <!-- Text input -->
            <div class="text-bar">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                [(ngModel)]="messageText"
                (keydown.enter)="sendTextMessage()"
                [disabled]="sending()"
              />
              <button class="btn-send" (click)="sendTextMessage()" [disabled]="!messageText.trim() || sending()">
                ➤
              </button>
            </div>
          </div>
        }
      }
    </section>

    <!-- Game picker modal -->
    @if (showGamePicker()) {
      <div class="modal-overlay" (click)="showGamePicker.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3>🎮 Compartir juego de tu colección</h3>

          @if (myGames().length === 0) {
            <p class="modal-empty">No tienes juegos en tu colección.</p>
          }

          <div class="games-pick-grid">
            @for (game of myGames(); track game.id) {
              <button class="game-pick-item" (click)="sendGameMessage(game)">
                <div class="pick-img" [style.backgroundImage]="'url(' + game.background_image + ')'"></div>
                <span class="pick-name">{{ game.name }}</span>
              </button>
            }
          </div>

          <button class="btn-modal-close" (click)="showGamePicker.set(false)">Cerrar</button>
        </div>
      </div>
    }
  `
})
export class ChatComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public messagingService = inject(MessagingService);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private socialService = inject(SocialService);
  private collectionService = inject(CollectionService);
  private toast = inject(ToastService);

  // State
  otherProfile = signal<UserProfile | null>(null);
  isMutualFollow = signal(false);
  loading = signal(true);
  sending = signal(false);
  myUid = '';
  otherUid = '';
  conversationId = '';

  // Input state
  messageText = '';
  imageMode = signal<'none' | 'url' | 'file'>('none');
  imageUrl = '';
  filePreview = signal<string | null>(null);
  showAttachMenu = signal(false);
  showGamePicker = signal(false);
  myGames = signal<SavedGame[]>([]);

  // Auto-scroll
  messagesContainer = viewChild<ElementRef>('messagesContainer');

  constructor() {
    effect(() => {
      this.messagingService.messages(); // track dependency
      setTimeout(() => {
        const el = this.messagesContainer()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }, 80);
    });
  }

  async ngOnInit() {
    this.otherUid = this.route.snapshot.paramMap.get('uid') ?? '';
    this.myUid = this.authService.currentUserSig()?.uid ?? '';

    if (!this.otherUid || !this.myUid || this.otherUid === this.myUid) {
      this.loading.set(false);
      return;
    }

    // Cargar perfil primero (separado para que errores de conversación no lo oculten)
    try {
      const prof = await this.profileService.getPublicProfile(this.otherUid);
      this.otherProfile.set(prof);
    } catch {
      this.otherProfile.set(null);
      this.loading.set(false);
      return;
    }

    if (!this.otherProfile()) {
      this.loading.set(false);
      return;
    }

    // Operaciones de conversación (try/catch separado)
    try {
      const mutual = await this.socialService.areMutualFollowers(this.myUid, this.otherUid);
      this.isMutualFollow.set(mutual);

      this.conversationId = this.messagingService.getConversationId(this.myUid, this.otherUid);

      if (mutual) {
        await this.messagingService.getOrCreateConversation(this.otherUid);
      }

      this.messagingService.listenMessages(this.conversationId);
    } catch {
      // Errores de conversación no ocultan el perfil
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.messagingService.stopMessages();
  }

  // === Enviar texto ===
  async sendTextMessage() {
    const text = this.messageText.trim();
    if (!text || !this.conversationId) return;
    this.sending.set(true);
    this.messageText = '';
    try {
      await this.messagingService.sendMessage(this.conversationId, { type: 'text', content: text });
    } catch {
      this.toast.error('Error al enviar el mensaje');
    } finally {
      this.sending.set(false);
    }
  }

  // === Menú de adjuntos ===
  toggleAttachMenu() {
    this.showAttachMenu.update(v => !v);
  }

  selectImageMode(mode: 'url' | 'file') {
    this.imageMode.set(mode);
    this.showAttachMenu.set(false);
    this.imageUrl = '';
    this.filePreview.set(null);
  }

  // === Enviar imagen por URL ===
  async sendImage() {
    const url = this.imageUrl.trim();
    if (!url || !this.conversationId) return;
    this.sending.set(true);
    const isGif = url.toLowerCase().endsWith('.gif') || url.toLowerCase().includes('.gif');
    try {
      await this.messagingService.sendMessage(this.conversationId, {
        type: isGif ? 'gif' : 'image',
        content: url,
      });
      this.imageUrl = '';
      this.imageMode.set('none');
    } catch {
      this.toast.error('Error al enviar la imagen');
    } finally {
      this.sending.set(false);
    }
  }

  // === Enviar imagen desde archivo ===
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      this.toast.error('Imagen demasiado grande. Máximo 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.filePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  async sendFileImage() {
    const data = this.filePreview();
    if (!data || !this.conversationId) return;
    this.sending.set(true);
    const isGif = data.includes('image/gif');
    try {
      await this.messagingService.sendMessage(this.conversationId, {
        type: isGif ? 'gif' : 'image',
        content: data,
      });
      this.filePreview.set(null);
      this.imageMode.set('none');
    } catch {
      this.toast.error('Error al enviar la imagen');
    } finally {
      this.sending.set(false);
    }
  }

  // === Compartir juego ===
  async openGamePicker() {
    this.showAttachMenu.set(false);
    const games = await this.collectionService.loadUserCollection();
    this.myGames.set(games);
    this.showGamePicker.set(true);
  }

  async sendGameMessage(game: SavedGame) {
    if (!this.conversationId) return;
    this.sending.set(true);
    try {
      await this.messagingService.sendMessage(this.conversationId, {
        type: 'game',
        content: '',
        gameData: {
          id: game.id,
          name: game.name,
          background_image: game.background_image,
          rating: game.rating,
        },
      });
      this.showGamePicker.set(false);
      this.toast.success(`Juego "${game.name}" compartido`);
    } catch {
      this.toast.error('Error al compartir el juego');
    } finally {
      this.sending.set(false);
    }
  }

  formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) +
      ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
