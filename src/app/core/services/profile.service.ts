import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from '@angular/fire/firestore';

export interface UserProfile {
  uid: string;
  username: string;        // Nombre gamer del jugador
  email: string;
  photoURL: string;        // URL remota o data:image base64
  description: string;     // Descripción / bio del jugador
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private firestore = inject(Firestore);

  // Signal reactivo con el perfil del usuario actual
  profileSig = signal<UserProfile | null>(null);

  /** Límite de tamaño para imágenes base64 (800 KB para dejar margen en el doc de 1 MB) */
  private readonly MAX_PHOTO_BYTES = 800 * 1024;

  /** Valida que la foto no exceda el límite de Firestore */
  validatePhoto(dataUrl: string): boolean {
    // Las URLs externas siempre pasan
    if (!dataUrl.startsWith('data:')) return true;
    // Calcular tamaño aprox. del base64
    const base64 = dataUrl.split(',')[1] ?? '';
    const bytes = (base64.length * 3) / 4;
    return bytes <= this.MAX_PHOTO_BYTES;
  }

  /** Crea el perfil del usuario en Firestore tras el registro */
  async createProfile(uid: string, data: { username: string; email: string; photoURL: string; description?: string }): Promise<void> {
    const profile: UserProfile = {
      uid,
      username: data.username,
      email: data.email,
      photoURL: data.photoURL,
      description: data.description ?? '',
      createdAt: Date.now(),
    };
    await setDoc(doc(this.firestore, 'profiles', uid), profile);
    this.profileSig.set(profile);
  }

  /** Carga el perfil desde Firestore */
  async loadProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(this.firestore, 'profiles', uid));
    if (snap.exists()) {
      const profile = snap.data() as UserProfile;
      this.profileSig.set(profile);
      return profile;
    }
    this.profileSig.set(null);
    return null;
  }

  /** Actualiza campos del perfil */
  async updateProfile(uid: string, data: Partial<Pick<UserProfile, 'username' | 'photoURL' | 'description'>>): Promise<void> {
    await updateDoc(doc(this.firestore, 'profiles', uid), data);
    // Actualizar Signal local
    this.profileSig.update(prev => prev ? { ...prev, ...data } : prev);
  }

  /** Carga el perfil público de cualquier usuario */
  async getPublicProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(this.firestore, 'profiles', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  /** Busca usuarios por prefijo de username */
  async searchUsers(term: string): Promise<UserProfile[]> {
    if (!term || term.length < 2) return [];
    const col = collection(this.firestore, 'profiles');
    const q = query(col, where('username', '>=', term), where('username', '<=', term + '\uf8ff'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
  }
}
