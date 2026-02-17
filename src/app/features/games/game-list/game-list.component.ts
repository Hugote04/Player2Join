import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../core/services/game.service';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>🎮 Catálogo de Player2Join</h2>
      
      @if (loading()) {
        <div class="loader">Buscando juegos...</div>
      }

      <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
        @for (game of games(); track game.id) {
          <div class="card" style="border: 1px solid #444; padding: 10px; border-radius: 8px;">
            <img [src]="game.background_image" style="width: 100%; border-radius: 4px;">
            <h3>{{ game.name }}</h3>
            <p>Rating: ⭐ {{ game.rating }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class GameListComponent implements OnInit {
  private gameService = inject(GameService);
  
  games = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loading.set(true);
    this.gameService.getGames().subscribe({
      next: (data) => {
        this.games.set(data.results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}