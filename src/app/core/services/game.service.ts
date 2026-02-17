import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  // URL base — el interceptor rawgInterceptor añade la API key automáticamente (Check 33)
  private apiUrl = 'https://api.rawg.io/api/games';

  // Check 34: Signal para estado reactivo
  gamesSig = signal<any[]>([]);

  // Check 12: Obtener lista de juegos populares con paginación
  getGames(page = 1, pageSize = 20): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      params: { page: page.toString(), page_size: pageSize.toString() }
    });
  }

  // Check 12: Buscar juegos por nombre con paginación
  searchGames(query: string, page = 1, pageSize = 20): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      params: { search: query, page: page.toString(), page_size: pageSize.toString() }
    });
  }

  // Check 32: Detalle de un juego
  getGameById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Capturas de pantalla de un juego
  getGameScreenshots(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/screenshots`);
  }
}