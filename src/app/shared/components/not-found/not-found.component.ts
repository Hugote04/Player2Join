import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="text-align: center; margin-top: 50px;">
      <h1>404 - ¡Game Over!</h1>
      <p>La página que buscas no existe en este nivel.</p>
      <a routerLink="/home">Volver al Inicio</a>
    </div>
  `
})
export class NotFoundComponent {}