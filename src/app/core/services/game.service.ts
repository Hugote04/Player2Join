import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
} from '@angular/fire/firestore';

/** Interfaz de un juego añadido manualmente al catálogo */
export interface CustomGame {
  id: string;
  name: string;
  description: string;
  background_image: string;
  rating: number;
  released: string;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string; slug: string } }[];
  website?: string;
  addedByUid: string;
  addedAt: number;
  isCustom: true;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);

  // URL base — el interceptor rawgInterceptor añade la API key automáticamente (Check 33)
  private apiUrl = 'https://api.rawg.io/api/games';

  // Check 34: Signal para estado reactivo
  gamesSig = signal<any[]>([]);

  /** Signal con los juegos custom cargados de Firestore */
  customGamesSig = signal<CustomGame[]>([]);

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

  // ==================== JUEGOS CUSTOM ====================

  /** Carga todos los juegos custom de Firestore */
  async loadCustomGames(): Promise<CustomGame[]> {
    const snap = await getDocs(collection(this.firestore, 'custom_games'));
    const games = snap.docs.map(d => d.data() as CustomGame);
    this.customGamesSig.set(games);
    return games;
  }

  /** Obtiene un juego custom por su ID */
  async getCustomGameById(id: string): Promise<CustomGame | null> {
    const ref = doc(this.firestore, 'custom_games', id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as CustomGame) : null;
  }

  /** Añade un juego personalizado al catálogo */
  async addCustomGame(game: Omit<CustomGame, 'id' | 'addedAt' | 'isCustom'>): Promise<CustomGame> {
    const id = `custom_${Date.now()}`;
    const custom: CustomGame = {
      ...game,
      id,
      addedAt: Date.now(),
      isCustom: true,
    };
    await setDoc(doc(this.firestore, 'custom_games', id), custom);
    this.customGamesSig.update(list => [...list, custom]);
    return custom;
  }

  /** Actualiza un juego custom existente */
  async updateCustomGame(id: string, data: Partial<Omit<CustomGame, 'id' | 'addedAt' | 'isCustom'>>): Promise<void> {
    await setDoc(doc(this.firestore, 'custom_games', id), data, { merge: true });
    this.customGamesSig.update(list =>
      list.map(g => g.id === id ? { ...g, ...data } as CustomGame : g)
    );
  }

  /** Elimina un juego custom del catálogo */
  async deleteCustomGame(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'custom_games', id));
    this.customGamesSig.update(list => list.filter(g => g.id !== id));
  }
}