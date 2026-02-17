import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from '@angular/fire/firestore';

export interface AppNotification {
  id: string;
  type: 'follow';               // Extensible a otros tipos
  fromUid: string;
  fromUsername: string;
  fromPhotoURL: string;
  toUid: string;
  read: boolean;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private firestore = inject(Firestore);

  notifications = signal<AppNotification[]>([]);
  unreadCount = signal(0);

  private unsub: Unsubscribe | null = null;

  /** Escucha notificaciones en tiempo real para el usuario actual */
  listenNotifications(uid: string): void {
    this.stopListening();

    const col = collection(this.firestore, 'notifications');
    const q = query(col, where('toUid', '==', uid), orderBy('createdAt', 'desc'));

    this.unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
      this.notifications.set(notifs);
      this.unreadCount.set(notifs.filter(n => !n.read).length);
    }, () => {
      // Si falla (índice no creado, etc.) cargamos una vez
      this.loadOnce(uid);
    });
  }

  /** Carga manual sin listener (fallback) */
  private async loadOnce(uid: string) {
    try {
      const col = collection(this.firestore, 'notifications');
      const q = query(col, where('toUid', '==', uid));
      const snap = await getDocs(q);
      const notifs = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as AppNotification))
        .sort((a, b) => b.createdAt - a.createdAt);
      this.notifications.set(notifs);
      this.unreadCount.set(notifs.filter(n => !n.read).length);
    } catch {
      this.notifications.set([]);
      this.unreadCount.set(0);
    }
  }

  /** Crear notificación de follow */
  async createFollowNotification(
    fromUid: string,
    fromUsername: string,
    fromPhotoURL: string,
    toUid: string,
  ): Promise<void> {
    if (fromUid === toUid) return;

    const docId = `follow_${fromUid}_${toUid}`;
    const notif: Omit<AppNotification, 'id'> = {
      type: 'follow',
      fromUid,
      fromUsername,
      fromPhotoURL,
      toUid,
      read: false,
      createdAt: Date.now(),
    };
    await setDoc(doc(this.firestore, 'notifications', docId), notif);
  }

  /** Marcar una notificación como leída */
  async markAsRead(notifId: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'notifications', notifId), { read: true });
    } catch { /* permisos */ }
    // Actualizar señal local inmediatamente
    this.notifications.update(list =>
      list.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
    this.unreadCount.set(this.notifications().filter(n => !n.read).length);
  }

  /** Marcar todas como leídas */
  async markAllAsRead(): Promise<void> {
    const unread = this.notifications().filter(n => !n.read);
    const promises = unread.map(n =>
      updateDoc(doc(this.firestore, 'notifications', n.id), { read: true }).catch(() => {})
    );
    await Promise.all(promises);
    // Actualizar señal local inmediatamente
    this.notifications.update(list =>
      list.map(n => ({ ...n, read: true }))
    );
    this.unreadCount.set(0);
  }

  /** Dejar de escuchar */
  stopListening(): void {
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }
  }

  /** Limpiar al logout */
  clear(): void {
    this.stopListening();
    this.notifications.set([]);
    this.unreadCount.set(0);
  }
}
