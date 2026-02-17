import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Públicas (Check 22, 23, 24)
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { 
    path: 'home', 
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

  // Detalle de juego (Check 32)
  {
    path: 'game/:id',
    loadComponent: () => import('./features/games/game-detail/game-detail.component').then(m => m.GameDetailComponent)
  },

  // Error (Check 11 / 28)
  { 
    path: '**', 
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent) 
  }
];