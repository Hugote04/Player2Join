import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { ProfileService, UserProfile } from './profile.service';
import { NotificationService } from './notification.service';

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class SocialService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);

  /** Seguir a un usuario */
  async followUser(targetUid: string): Promise<void> {
    const uid = this.auth.currentUserSig()?.uid;
    if (!uid || uid === targetUid) return;

    const docId = `${uid}_${targetUid}`;
    const follow: Follow = {
      followerId: uid,
      followingId: targetUid,
      createdAt: Date.now(),
    };
    await setDoc(doc(this.firestore, 'follows', docId), follow);

    // Crear notificación para el usuario seguido
    try {
      const myProfile = this.profileService.profileSig();
      await this.notificationService.createFollowNotification(
        uid,
        myProfile?.username ?? 'Jugador',
        myProfile?.photoURL ?? '',
        targetUid,
      );
    } catch {
      // No bloquear el follow si falla la notificación
    }
  }

  /** Dejar de seguir a un usuario */
  async unfollowUser(targetUid: string): Promise<void> {
    const uid = this.auth.currentUserSig()?.uid;
    if (!uid) return;

    const docId = `${uid}_${targetUid}`;
    await deleteDoc(doc(this.firestore, 'follows', docId));
  }

  /** Comprobar si el usuario actual sigue a otro */
  async isFollowing(targetUid: string): Promise<boolean> {
    const uid = this.auth.currentUserSig()?.uid;
    if (!uid) return false;

    const docId = `${uid}_${targetUid}`;
    const snap = await getDoc(doc(this.firestore, 'follows', docId));
    return snap.exists();
  }

  /** Obtener número de seguidores */
  async getFollowersCount(uid: string): Promise<number> {
    const q = query(collection(this.firestore, 'follows'), where('followingId', '==', uid));
    const snap = await getDocs(q);
    return snap.size;
  }

  /** Obtener número de seguidos */
  async getFollowingCount(uid: string): Promise<number> {
    const q = query(collection(this.firestore, 'follows'), where('followerId', '==', uid));
    const snap = await getDocs(q);
    return snap.size;
  }

  /** Obtener lista de perfiles de seguidores */
  async getFollowers(uid: string): Promise<UserProfile[]> {
    const q = query(collection(this.firestore, 'follows'), where('followingId', '==', uid));
    const snap = await getDocs(q);
    const follows = snap.docs.map(d => d.data() as Follow);

    const profiles: UserProfile[] = [];
    for (const f of follows) {
      const prof = await this.profileService.getPublicProfile(f.followerId);
      if (prof) profiles.push(prof);
    }
    return profiles;
  }

  /** Obtener lista de perfiles seguidos */
  async getFollowing(uid: string): Promise<UserProfile[]> {
    const q = query(collection(this.firestore, 'follows'), where('followerId', '==', uid));
    const snap = await getDocs(q);
    const follows = snap.docs.map(d => d.data() as Follow);

    const profiles: UserProfile[] = [];
    for (const f of follows) {
      const prof = await this.profileService.getPublicProfile(f.followingId);
      if (prof) profiles.push(prof);
    }
    return profiles;
  }

  /** Comprueba si dos usuarios se siguen mutuamente (para DMs) */
  async areMutualFollowers(uid1: string, uid2: string): Promise<boolean> {
    const [snap1, snap2] = await Promise.all([
      getDoc(doc(this.firestore, 'follows', `${uid1}_${uid2}`)),
      getDoc(doc(this.firestore, 'follows', `${uid2}_${uid1}`)),
    ]);
    return snap1.exists() && snap2.exists();
  }
}
