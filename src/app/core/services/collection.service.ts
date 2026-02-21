import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  collectionData,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

/**
 * Juego guardado en la colección personal de un usuario.
 * Se almacena en la colección `collections` de Firestore.
 */
export interface SavedGame {
  /** ID del juego (RAWG ID o custom ID) */
  id: string;
  /** Nombre del juego */
  name: string;
  /** URL de la imagen de fondo */
  background_image: string;
  /** Valoración del juego (0-5) */
  rating: number;
  /** Fecha de lanzamiento (YYYY-MM-DD) */
  released: string;
  /** UID del usuario dueño */
  uid: string;
  /** Timestamp de cuando se añadió a la colección */
  addedAt: number;
  /** Notas personales del usuario */
  notes?: string;
  /** Estado de progreso del juego */
  status?: 'playing' | 'completed' | 'wishlist' | 'dropped';
}

/**
 * Juego oculto del catálogo por un administrador.
 * Se almacena en la colección `hidden_games` de Firestore.
 */
export interface HiddenGame {
  /** ID del juego en RAWG */
  id: string;
  /** Nombre del juego */
  name: string;
  /** URL de la imagen */
  background_image: string;
  /** Valoración */
  rating: number;
  /** Timestamp de ocultación */
  hiddenAt: number;
  /** UID del admin que lo ocultó */
  hiddenByUid: string;
}

/**
 * CollectionService — Gestiona la colección personal de juegos de cada usuario.
 *
 * Responsabilidades:
 * - CRUD de juegos guardados en `collections` (Firestore)
 * - Gestión de juegos ocultos del catálogo por admins (`hidden_games`)
 * - Signals reactivos para actualizar la UI automáticamente (RA8 - Check 34)
 *
 * @remarks
 * Los documentos en `collections` usan la clave compuesta `{uid}_{gameId}`.
 * Los juegos ocultos se almacenan en `hidden_games` con el ID de RAWG.
 */
@Injectable({ providedIn: 'root' })
export class CollectionService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  /** Signal reactivo con los IDs de juegos guardados para badges en la UI (Check 34) */
  savedIds = signal<Set<string>>(new Set());

  // Referencia a la colección
  private get colRef() {
    return collection(this.firestore, 'collections');
  }

  /**
   * Carga los juegos guardados de cualquier usuario por su UID.
   * Se usa para ver colecciones ajenas en perfiles públicos.
   * @param uid - UID del usuario cuya colección se quiere cargar
   * @returns Array de SavedGame
   */
  async loadCollectionByUid(uid: string): Promise<SavedGame[]> {
    const q = query(this.colRef, where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SavedGame);
  }

  /**
   * Carga la colección del usuario autenticado y actualiza el signal `savedIds`.
   * @returns Array de SavedGame del usuario actual
   */
  async loadUserCollection(): Promise<SavedGame[]> {
    const uid = this.auth.currentUserSig()?.uid;
    if (!uid) return [];

    const q = query(this.colRef, where('uid', '==', uid));
    const snap = await getDocs(q);
    const games = snap.docs.map(d => d.data() as SavedGame);

    // Actualizar Signal de IDs
    this.savedIds.set(new Set(games.map(g => g.id)));
    return games;
  }

  /**
   * Añade un juego a la colección del usuario autenticado.
   * @param game - Datos del juego (procedente de RAWG o custom)
   */
  async addGame(game: any): Promise<void> {
    const uid = this.auth.currentUserSig()?.uid;
    if (!uid) return;

    const docId = `${uid}_${game.id}`;
    const saved: SavedGame = {
      id: String(game.id),
      name: game.name,
      background_image: game.background_image ?? '',
      rating: game.rating ?? 0,
      released: game.released ?? '',
      uid,
      addedAt: Date.now(),
    };

    await setDoc(doc(this.firestore, 'collections', docId), saved);

    // Actualizar Signal
    this.savedIds.update(set => {
      const next = new Set(set);
      next.add(String(game.id));
      return next;
    });
  }

  /**
   * Elimina un juego de la colección del usuario autenticado.
   * @param gameId - ID del juego a eliminar
   */
  async removeGame(gameId: string): Promise<void> {
    const uid = this.auth.currentUserSig()?.uid;
    if (!uid) return;

    const docId = `${uid}_${gameId}`;
    await deleteDoc(doc(this.firestore, 'collections', docId));

    // Actualizar Signal
    this.savedIds.update(set => {
      const next = new Set(set);
      next.delete(gameId);
      return next;
    });
  }

  /**
   * Comprueba si un juego está en la colección del usuario.
   * @param gameId - ID del juego a comprobar
   * @returns `true` si el juego está guardado
   */
  isSaved(gameId: string): boolean {
    return this.savedIds().has(String(gameId));
  }

  /**
   * Actualiza los campos editables de un juego guardado.
   * @param uid    - UID del dueño del juego
   * @param gameId - ID del juego RAWG
   * @param data   - Campos a actualizar (notes, status)
   */
  async updateGame(uid: string, gameId: string, data: Partial<Pick<SavedGame, 'notes' | 'status'>>): Promise<void> {
    const docId = `${uid}_${gameId}`;
    await setDoc(doc(this.firestore, 'collections', docId), data, { merge: true });
  }

  // ==================== ADMIN: CATÁLOGO ====================

  /** Signal con los IDs de juegos ocultos del catálogo por admins */
  hiddenIds = signal<Set<string>>(new Set());

  /**
   * Carga los IDs de juegos ocultos del catálogo desde Firestore.
   * Se usa en game-list para filtrar juegos que el admin ha ocultado.
   * @returns Array de HiddenGame
   */
  async loadHiddenGames(): Promise<HiddenGame[]> {
    const snap = await getDocs(collection(this.firestore, 'hidden_games'));
    const games = snap.docs.map(d => d.data() as HiddenGame);
    this.hiddenIds.set(new Set(games.map(g => g.id)));
    return games;
  }

  /**
   * (Admin) Oculta un juego del catálogo para todos los usuarios.
   * @param game     - Datos del juego a ocultar
   * @param adminUid - UID del administrador que realiza la acción
   */
  async hideGameFromCatalog(game: any, adminUid: string): Promise<void> {
    const hidden: HiddenGame = {
      id: String(game.id),
      name: game.name,
      background_image: game.background_image ?? '',
      rating: game.rating ?? 0,
      hiddenAt: Date.now(),
      hiddenByUid: adminUid
    };
    await setDoc(doc(this.firestore, 'hidden_games', String(game.id)), hidden);
    this.hiddenIds.update(set => {
      const next = new Set(set);
      next.add(String(game.id));
      return next;
    });
  }

  /**
   * (Admin) Restaura un juego previamente oculto al catálogo.
   * @param gameId - ID del juego a restaurar
   */
  async restoreGameToCatalog(gameId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'hidden_games', gameId));
    this.hiddenIds.update(set => {
      const next = new Set(set);
      next.delete(gameId);
      return next;
    });
  }

  /**
   * Comprueba si un juego está oculto del catálogo.
   * @param gameId - ID del juego a comprobar
   * @returns `true` si está oculto
   */
  isHidden(gameId: string): boolean {
    return this.hiddenIds().has(String(gameId));
  }
}
