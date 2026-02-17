import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav style="display: flex; gap: 20px; padding: 10px; background: #222; color: white;">
      <a routerLink="/home" routerLinkActive="active">Player2Join</a>
      
      @if (authService.currentUserSig()) {
        <a routerLink="/dashboard">Dashboard</a>
        <button (click)="authService.logout()">Logout</button>
      } @else {
        <a routerLink="/login">Login</a>
        <a routerLink="/registro">Registro</a>
      }
    </nav>
  `
})
export class NavbarComponent {
  public authService = inject(AuthService); // Usamos el Signal del RA8 [cite: 308]
}