import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styleUrl: './navbar.component.scss',
  template: `
    <nav class="navbar">
      <!-- Logo -->
      <a routerLink="/home" class="navbar__logo">
        <img class="logo-img" src="logo_p2j.png" alt="Player2Join" />
        <span>Player<span class="logo-highlight">2</span>Join</span>
      </a>

      <!-- Links centrales -->
      <div class="navbar__links">
        <a routerLink="/home" routerLinkActive="active" class="nav-link">Catálogo</a>
        @if (authService.currentUserSig()) {
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Mi Colección</a>
          <a routerLink="/buscar" routerLinkActive="active" class="nav-link">Jugadores</a>
        }
        @if (authService.isAdmin()) {
          <a routerLink="/admin/historial" routerLinkActive="active" class="nav-link admin-link">🛡️ Admin</a>
        }
      </div>

      <!-- Auth -->
      <div class="navbar__auth">
        @if (authService.currentUserSig()) {
          <!-- Campana de notificaciones -->
          <div class="notif-wrapper">
            <button class="btn-notif" (click)="toggleNotifPanel()">
              🔔
              @if (notificationService.unreadCount() > 0) {
                <span class="notif-badge">{{ notificationService.unreadCount() }}</span>
              }
            </button>

            @if (showNotifPanel()) {
              <div class="notif-panel">
                <div class="notif-header">
                  <h4>Notificaciones</h4>
                  @if (notificationService.unreadCount() > 0) {
                    <button class="btn-mark-read" (click)="markAllRead()">Marcar leídas</button>
                  }
                </div>

                @if (notificationService.notifications().length === 0) {
                  <p class="notif-empty">Sin notificaciones</p>
                }

                <div class="notif-list">
                  @for (notif of notificationService.notifications(); track notif.id) {
                    <a
                      class="notif-item"
                      [class.unread]="!notif.read"
                      [routerLink]="['/usuario', notif.fromUid]"
                      (click)="onNotifClick(notif)"
                    >
                      <div class="notif-avatar">
                        @if (notif.fromPhotoURL) {
                          <img [src]="notif.fromPhotoURL" alt="" />
                        } @else {
                          <span class="avatar-fallback">{{ notif.fromUsername.charAt(0).toUpperCase() }}</span>
                        }
                      </div>
                      <div class="notif-body">
                        <p><strong>{{ notif.fromUsername }}</strong> te ha seguido</p>
                        <span class="notif-time">{{ timeAgo(notif.createdAt) }}</span>
                      </div>
                    </a>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Avatar + Nombre Gamer -->
          <a routerLink="/perfil" class="user-profile-link">
            <div class="user-avatar">
              @if (profilePhoto()) {
                <img [src]="profilePhoto()" alt="Avatar" />
              } @else {
                <span class="avatar-fallback">{{ gamerInitial() }}</span>
              }
            </div>
            <span class="user-name">{{ gamerName() }}</span>
            @if (authService.isAdmin()) {
              <span class="role-badge admin">ADMIN</span>
            }
          </a>
          <button class="btn-logout" (click)="authService.logout()">Logout</button>
        } @else {
          <a routerLink="/login" class="btn-login">Iniciar Sesión</a>
          <a routerLink="/registro" class="btn-register">Registro</a>
        }
      </div>
    </nav>
  `
})
export class NavbarComponent {
  public authService = inject(AuthService);
  private profileService = inject(ProfileService);
  public notificationService = inject(NotificationService);

  showNotifPanel = signal(false);

  // Computed signals para el nombre gamer y foto
  gamerName = computed(() => {
    const prof = this.profileService.profileSig();
    if (prof?.username) return prof.username;
    const user = this.authService.currentUserSig();
    return user?.email?.split('@')[0] ?? 'Jugador';
  });

  profilePhoto = computed(() => this.profileService.profileSig()?.photoURL ?? '');

  gamerInitial = computed(() => this.gamerName().charAt(0).toUpperCase());

  toggleNotifPanel() {
    this.showNotifPanel.update(v => !v);
  }

  async onNotifClick(notif: AppNotification) {
    if (!notif.read) {
      await this.notificationService.markAsRead(notif.id);
    }
    this.showNotifPanel.set(false);
  }

  async markAllRead() {
    await this.notificationService.markAllAsRead();
  }

  timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Hace ${days}d`;
    return new Date(timestamp).toLocaleDateString('es-ES');
  }
}