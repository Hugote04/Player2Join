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

/**
 * GameService — Servicio principal para acceder al catálogo de videojuegos.
 *
 * Combina dos fuentes de datos:
 * - **RAWG API** para juegos públicos (búsqueda, detalle, capturas)
 * - **Firestore** (`custom_games`) para juegos añadidos por administradores
 *
 * Expone Signals reactivos para que los componentes se actualicen
 * automáticamente al añadir, editar o eliminar juegos custom (RA8 - Check 34).
 *
 * @remarks
 * El interceptor `rawgInterceptor` añade la API key de RAWG de forma transparente.
 */
@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);

  // URL base — el interceptor rawgInterceptor añade la API key automáticamente (Check 33)
  private apiUrl = 'https://api.rawg.io/api/games';

  /** Signal reactivo con los juegos cargados de RAWG (Check 34) */
  gamesSig = signal<any[]>([]);

  /** Signal con los juegos custom cargados de Firestore */
  customGamesSig = signal<CustomGame[]>([]);

  /**
   * Obtiene una página de juegos populares desde RAWG.
   * @param page     - Número de página (por defecto 1)
   * @param pageSize - Resultados por página (por defecto 20)
   * @returns Observable con la respuesta paginada de RAWG
   */
  getGames(page = 1, pageSize = 20): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      params: { page: page.toString(), page_size: pageSize.toString() }
    });
  }

  /**
   * Busca juegos por nombre en RAWG con paginación.
   * @param query    - Texto de búsqueda
   * @param page     - Número de página
   * @param pageSize - Resultados por página
   * @returns Observable con la respuesta paginada de RAWG
   */
  searchGames(query: string, page = 1, pageSize = 20): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      params: { search: query, page: page.toString(), page_size: pageSize.toString() }
    });
  }

  /**
   * Obtiene el detalle completo de un juego de RAWG.
   * @param id - ID del juego en RAWG
   * @returns Observable con los datos del juego
   */
  getGameById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene las capturas de pantalla de un juego.
   * @param id - ID del juego en RAWG
   * @returns Observable con el array de screenshots
   */
  getGameScreenshots(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/screenshots`);
  }

  // ==================== JUEGOS CUSTOM ====================

  /**
   * Carga todos los juegos custom de Firestore y actualiza el signal.
   * @returns Array de CustomGame
   */
  async loadCustomGames(): Promise<CustomGame[]> {
    const snap = await getDocs(collection(this.firestore, 'custom_games'));
    const games = snap.docs.map(d => d.data() as CustomGame);
    this.customGamesSig.set(games);
    return games;
  }

  /**
   * Obtiene un juego custom por su ID de Firestore.
   * @param id - ID del juego (prefijo `custom_`)
   * @returns El juego encontrado o null
   */
  async getCustomGameById(id: string): Promise<CustomGame | null> {
    const ref = doc(this.firestore, 'custom_games', id);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as CustomGame) : null;
  }

  /**
   * Añade un juego personalizado al catálogo en Firestore.
   * Genera un ID con prefijo `custom_` y timestamp.
   * @param game - Datos del juego (sin id, addedAt ni isCustom)
   * @returns El juego creado con su ID asignado
   */
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

  /**
   * Actualiza un juego custom existente en Firestore (merge).
   * @param id   - ID del juego a actualizar
   * @param data - Campos parciales a actualizar
   */
  async updateCustomGame(id: string, data: Partial<Omit<CustomGame, 'id' | 'addedAt' | 'isCustom'>>): Promise<void> {
    await setDoc(doc(this.firestore, 'custom_games', id), data, { merge: true });
    this.customGamesSig.update(list =>
      list.map(g => g.id === id ? { ...g, ...data } as CustomGame : g)
    );
  }

  /**
   * Elimina un juego custom del catálogo en Firestore.
   * @param id - ID del juego a eliminar
   */
  async deleteCustomGame(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'custom_games', id));
    this.customGamesSig.update(list => list.filter(g => g.id !== id));
  }
}