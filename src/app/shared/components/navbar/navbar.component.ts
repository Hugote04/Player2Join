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

      <!-- Hamburger toggle (solo móvil) -->
      <button class="navbar__burger" [class.open]="menuOpen()" (click)="toggleMenu()">
        <span></span><span></span><span></span>
      </button>

      <!-- Links centrales -->
      <div class="navbar__links" [class.show]="menuOpen()">
        <a routerLink="/catalogo" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Catálogo</a>
        @if (authService.currentUserSig()) {
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Mi Colección</a>
          <a routerLink="/buscar" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Jugadores</a>
        }
        @if (authService.isAdmin()) {
          <a routerLink="/admin/historial" routerLinkActive="active" class="nav-link admin-link" (click)="closeMenu()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>
            Admin
          </a>
        }
      </div>

      <!-- Auth -->
      <div class="navbar__auth" [class.show]="menuOpen()">
        @if (authService.currentUserSig()) {
          <!-- Campana de notificaciones -->
          <div class="notif-wrapper">
            <button class="btn-notif" (click)="toggleNotifPanel()" aria-label="Notificaciones">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>
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
          <a routerLink="/perfil" class="user-profile-link" (click)="closeMenu()">
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
          <button class="btn-logout" (click)="authService.logout(); closeMenu()">Logout</button>
        } @else {
          <a routerLink="/login" class="btn-login" (click)="closeMenu()">Iniciar Sesión</a>
          <a routerLink="/registro" class="btn-register" (click)="closeMenu()">Registro</a>
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
  menuOpen = signal(false);

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

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
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