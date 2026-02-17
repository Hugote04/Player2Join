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

export interface SavedGame {
  id: string;          // RAWG game id
  name: string;
  background_image: string;
  rating: number;
  released: string;
  uid: string;         // Firebase user UID
  addedAt: number;     // timestamp
  notes?: string;      // Notas personales
  status?: 'playing' | 'completed' | 'wishlist' | 'dropped';
}

/** Juego oculto del catálogo por un admin */
export interface HiddenGame {
  id: string;          // RAWG game id
  name: string;
  background_image: string;
  rating: number;
  hiddenAt: number;
  hiddenByUid: string; // UID del admin que lo ocultó
}

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  // RA8 - Check 34: Signal con los IDs guardados para UI reactiva
  savedIds = signal<Set<string>>(new Set());

  // Referencia a la colección
  private get colRef() {
    return collection(this.firestore, 'collections');
  }

  /** Carga los juegos guardados de cualquier usuario por UID */
  async loadCollectionByUid(uid: string): Promise<SavedGame[]> {
    const q = query(this.colRef, where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SavedGame);
  }

  /** Carga los juegos guardados del usuario actual */
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

  /** Añade un juego a la colección del usuario */
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

  /** Elimina un juego de la colección */
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

  /** Comprueba si un juego está en la colección */
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

  /** Signal con IDs de juegos ocultos del catálogo */
  hiddenIds = signal<Set<string>>(new Set());

  /** Carga los IDs ocultos del catálogo (para filtrar en game-list) */
  async loadHiddenGames(): Promise<HiddenGame[]> {
    const snap = await getDocs(collection(this.firestore, 'hidden_games'));
    const games = snap.docs.map(d => d.data() as HiddenGame);
    this.hiddenIds.set(new Set(games.map(g => g.id)));
    return games;
  }

  /** Admin: Ocultar un juego del catálogo */
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

  /** Admin: Restaurar un juego oculto al catálogo */
  async restoreGameToCatalog(gameId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'hidden_games', gameId));
    this.hiddenIds.update(set => {
      const next = new Set(set);
      next.delete(gameId);
      return next;
    });
  }

  /** Comprueba si un juego está oculto del catálogo */
  isHidden(gameId: string): boolean {
    return this.hiddenIds().has(String(gameId));
  }
}
