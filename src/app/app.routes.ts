import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Públicas (Check 22, 23, 24)
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./features/games/game-list/game-list.component').then(m => m.GameListComponent)
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'registro', 
    loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent) 
  },

  // Privadas (Check 25 - Protegidas por Guard)
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/games/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard] 
  },
  {
    path: 'perfil',
    loadComponent: () => import('./features/auth/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },

  // Social
  {
    path: 'buscar',
    loadComponent: () => import('./features/social/user-search/user-search.component').then(m => m.UserSearchComponent),
    canActivate: [authGuard]
  },
  {
    path: 'usuario/:uid',
    loadComponent: () => import('./features/social/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'usuario/:uid/seguidores',
    loadComponent: () => import('./features/social/follow-list/follow-list.component').then(m => m.FollowListComponent),
    canActivate: [authGuard],
    data: { mode: 'followers' }
  },
  {
    path: 'usuario/:uid/siguiendo',
    loadComponent: () => import('./features/social/follow-list/follow-list.component').then(m => m.FollowListComponent),
    canActivate: [authGuard],
    data: { mode: 'following' }
  },

  // Detalle de juego (Check 32)
  {
    path: 'game/:id',
    loadComponent: () => import('./features/games/game-detail/game-detail.component').then(m => m.GameDetailComponent)
  },

  // Admin (Check 10 - solo admin con roleGuard)
  {
    path: 'admin/historial',
    loadComponent: () => import('./features/admin/admin-history/admin-history.component').then(m => m.AdminHistoryComponent),
    canActivate: [roleGuard]
  },

  // Error (Check 11 / 28)
  { 
    path: '**', 
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent) 
  }
];