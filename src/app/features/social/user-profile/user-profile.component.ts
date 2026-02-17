import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';
import { CollectionService, SavedGame } from '../../../core/services/collection.service';
import { SocialService } from '../../../core/services/social.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  styleUrl: './user-profile.component.scss',
  template: `
    <section class="user-profile-page">
      @if (loading()) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      }

      @if (!loading() && !userProfile()) {
        <div class="not-found">
          <h2>😕 Usuario no encontrado</h2>
          <a routerLink="/buscar" class="btn-back">← Volver a buscar</a>
        </div>
      }

      @if (!loading() && userProfile()) {
        <!-- Header del perfil -->
        <div class="profile-hero">
          <div class="hero-avatar">
            @if (userProfile()!.photoURL) {
              <img [src]="userProfile()!.photoURL" [alt]="userProfile()!.username" />
            } @else {
              <span class="avatar-fallback">{{ userProfile()!.username.charAt(0).toUpperCase() }}</span>
            }
          </div>

          <div class="hero-info">
            <h1 class="hero-username">{{ userProfile()!.username }}</h1>
            @if (userProfile()!.description) {
              <p class="hero-desc">{{ userProfile()!.description }}</p>
            }

            <div class="hero-stats">
              <a [routerLink]="['/usuario', targetUid, 'seguidores']" class="stat clickable">
                <span class="stat-num">{{ followersCount() }}</span>
                <span class="stat-lbl">Seguidores</span>
              </a>
              <a [routerLink]="['/usuario', targetUid, 'siguiendo']" class="stat clickable">
                <span class="stat-num">{{ followingCount() }}</span>
                <span class="stat-lbl">Siguiendo</span>
              </a>
              <div class="stat">
                <span class="stat-num">{{ games().length }}</span>
                <span class="stat-lbl">Juegos</span>
              </div>
            </div>

            <!-- Botón seguir/dejar de seguir -->
            @if (canFollow()) {
              <button
                class="btn-follow"
                [class.following]="isFollowing()"
                [disabled]="toggling()"
                (click)="toggleFollow()"
              >
                @if (toggling()) {
                  ...
                } @else if (isFollowing()) {
                  ✓ Siguiendo
                } @else {
                  + Seguir
                }
              </button>
            }

            @if (isOwnProfile()) {
              <a routerLink="/perfil" class="btn-edit-profile">✏️ Editar perfil</a>
            }
          </div>
        </div>

        <!-- Colección de juegos -->
        <div class="collection-section">
          <h2 class="section-title">🎮 Colección de {{ userProfile()!.username }}</h2>

          @if (games().length === 0) {
            <div class="empty-collection">
              <p>Este jugador aún no ha guardado juegos</p>
            </div>
          }

          @if (games().length > 0) {
            <div class="games-grid">
              @for (game of games(); track game.id) {
                <a [routerLink]="['/game', game.id]" class="game-card">
                  <div class="card-img" [style.backgroundImage]="'url(' + game.background_image + ')'">
                    <span class="card-rating">⭐ {{ game.rating | number:'1.1-1' }}</span>
                  </div>
                  <div class="card-body">
                    <h3 class="card-title">{{ game.name }}</h3>
                    <span class="card-date">{{ game.released }}</span>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      }
    </section>
  `
})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private profileService = inject(ProfileService);
  private collectionService = inject(CollectionService);
  private socialService = inject(SocialService);
  private authService = inject(AuthService);

  userProfile = signal<UserProfile | null>(null);
  games = signal<SavedGame[]>([]);
  loading = signal(true);
  followersCount = signal(0);
  followingCount = signal(0);
  isFollowing = signal(false);
  toggling = signal(false);
  canFollow = signal(false);
  isOwnProfile = signal(false);

  targetUid = '';

  async ngOnInit() {
    this.targetUid = this.route.snapshot.paramMap.get('uid') ?? '';
    if (!this.targetUid) {
      this.loading.set(false);
      return;
    }

    const currentUid = this.authService.currentUserSig()?.uid;
    this.isOwnProfile.set(currentUid === this.targetUid);
    this.canFollow.set(!!currentUid && currentUid !== this.targetUid);

    try {
      // Cargar perfil primero
      const profile = await this.profileService.getPublicProfile(this.targetUid);
      this.userProfile.set(profile);

      // Cargar colección por separado (puede fallar por permisos sin romper el perfil)
      try {
        const games = await this.collectionService.loadCollectionByUid(this.targetUid);
        games.sort((a, b) => b.addedAt - a.addedAt);
        this.games.set(games);
      } catch {
        this.games.set([]);
      }

      // Cargar datos sociales
      if (profile) {
        const [followers, following] = await Promise.all([
          this.socialService.getFollowersCount(this.targetUid),
          this.socialService.getFollowingCount(this.targetUid),
        ]);
        this.followersCount.set(followers);
        this.followingCount.set(following);

        if (this.canFollow()) {
          const following2 = await this.socialService.isFollowing(this.targetUid);
          this.isFollowing.set(following2);
        }
      }
    } catch {
      this.userProfile.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFollow() {
    this.toggling.set(true);
    try {
      if (this.isFollowing()) {
        await this.socialService.unfollowUser(this.targetUid);
        this.isFollowing.set(false);
        this.followersCount.update(c => Math.max(0, c - 1));
      } else {
        await this.socialService.followUser(this.targetUid);
        this.isFollowing.set(true);
        this.followersCount.update(c => c + 1);
      }
    } finally {
      this.toggling.set(false);
    }
  }
}
