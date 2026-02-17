import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  // URL base para obtener juegos de RAWG
  private apiUrl = 'https://api.rawg.io/api/games';

  // Check 34: Usamos Signals para el estado reactivo
  gamesSig = signal<any[]>([]);

  // Check 32: Operación de lectura (Read) de la lista de juegos
  getGames(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Check 32: Operación de lectura (Read) del detalle de un juego
  getGameById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}