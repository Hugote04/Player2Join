import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
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
}
