import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  Unsubscribe,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

/** Metadatos de una conversación entre dos usuarios */
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: number;
  lastMessageType: 'text' | 'image' | 'gif' | 'game';
  lastSenderId: string;
}

/** Mensaje individual de un chat */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'gif' | 'game';
  content: string;
  gameData?: {
    id: string;
    name: string;
    background_image: string;
    rating: number;
  };
  createdAt: number;
}

/**
 * MessagingService — Gestiona la mensajería privada entre usuarios mutuos.
 *
 * Usa Firestore con la estructura:
 * - `conversations/{convoId}` — metadatos de la conversación
 * - `conversations/{convoId}/messages/{msgId}` — mensajes individuales
 *
 * El ID de conversación se genera determinísticamente ordenando los UIDs
 * de los dos participantes, garantizando unicidad.
 */
@Injectable({ providedIn: 'root' })
export class MessagingService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  /** Conversaciones del usuario actual */
  conversations = signal<Conversation[]>([]);
  /** Mensajes de la conversación abierta */
  messages = signal<ChatMessage[]>([]);

  private msgUnsub: Unsubscribe | null = null;

  /** Genera un ID determinístico para la conversación entre dos UIDs */
  getConversationId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  /**
   * Obtiene o crea la conversación entre el usuario actual y otro usuario.
   * @returns ID de la conversación
   */
  async getOrCreateConversation(otherUid: string): Promise<string> {
    const myUid = this.auth.currentUserSig()?.uid;
    if (!myUid) throw new Error('No autenticado');

    const convoId = this.getConversationId(myUid, otherUid);
    const ref = doc(this.firestore, 'conversations', convoId);

    // Intentar leer (puede fallar porque las rules deniegan lectura si el doc no existe)
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) return convoId;
    } catch {
      // Doc no existe o permiso denegado — se creará a continuación
    }

    const convo: Conversation = {
      id: convoId,
      participants: [myUid, otherUid].sort(),
      lastMessage: '',
      lastMessageAt: Date.now(),
      lastMessageType: 'text',
      lastSenderId: '',
    };
    await setDoc(ref, convo);
    return convoId;
  }

  /**
   * Carga las conversaciones del usuario actual (sin tiempo real).
   * Solo devuelve conversaciones que tienen al menos un mensaje.
   */
  async loadMyConversations(): Promise<Conversation[]> {
    const uid = this.auth.currentUserSig()?.uid;
    if (!uid) return [];

    const col = collection(this.firestore, 'conversations');
    const q = query(col, where('participants', 'array-contains', uid));
    const snap = await getDocs(q);
    const convos = snap.docs
      .map(d => d.data() as Conversation)
      .filter(c => c.lastMessage)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    this.conversations.set(convos);
    return convos;
  }

  /**
   * Escucha mensajes en tiempo real de una conversación.
   * Actualiza el signal `messages` automáticamente.
   */
  listenMessages(conversationId: string): void {
    this.stopMessages();
    const col = collection(this.firestore, 'conversations', conversationId, 'messages');
    const q = query(col, orderBy('createdAt', 'asc'));

    this.msgUnsub = onSnapshot(q, (snap) => {
      this.messages.set(snap.docs.map(d => d.data() as ChatMessage));
    }, () => {
      this.loadMessagesOnce(conversationId);
    });
  }

  private async loadMessagesOnce(conversationId: string) {
    try {
      const col = collection(this.firestore, 'conversations', conversationId, 'messages');
      const q = query(col, orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      this.messages.set(snap.docs.map(d => d.data() as ChatMessage));
    } catch {
      this.messages.set([]);
    }
  }

  /**
   * Envía un mensaje en una conversación.
   * Actualiza los metadatos de la conversación (último mensaje, etc.).
   */
  async sendMessage(
    conversationId: string,
    msg: Pick<ChatMessage, 'type' | 'content' | 'gameData'>
  ): Promise<void> {
    const uid = this.auth.currentUserSig()?.uid;
    if (!uid) return;

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const messageData: Record<string, any> = {
      id: msgId,
      conversationId,
      senderId: uid,
      type: msg.type,
      content: msg.content,
      createdAt: Date.now(),
    };
    if (msg.gameData) {
      messageData['gameData'] = msg.gameData;
    }

    await setDoc(
      doc(this.firestore, 'conversations', conversationId, 'messages', msgId),
      messageData
    );

    // Preview del último mensaje
    const preview =
      msg.type === 'text' ? msg.content.slice(0, 60) :
      msg.type === 'game' ? `🎮 ${msg.gameData?.name ?? 'Juego'}` :
      '📷 Imagen';

    await updateDoc(doc(this.firestore, 'conversations', conversationId), {
      lastMessage: preview,
      lastMessageAt: messageData['createdAt'],
      lastMessageType: msg.type,
      lastSenderId: uid,
    });
  }

  /** Deja de escuchar mensajes */
  stopMessages(): void {
    if (this.msgUnsub) {
      this.msgUnsub();
      this.msgUnsub = null;
    }
  }

  /** Limpia todo el estado del servicio */
  clear(): void {
    this.stopMessages();
    this.conversations.set([]);
    this.messages.set([]);
  }

  // ========== Panel de mensajes (UI state) ==========

  /** Si el panel lateral de mensajes está abierto */
  panelOpen = signal(false);
  /** UID del usuario con el que se chatea en el panel */
  activeChatUid = signal('');

  /** Abre el panel en la vista de conversaciones */
  openPanel(): void {
    this.activeChatUid.set('');
    this.panelOpen.set(true);
  }

  /** Abre el panel directamente en un chat específico */
  openChat(uid: string): void {
    this.activeChatUid.set(uid);
    this.panelOpen.set(true);
  }

  /** Cierra el panel */
  closePanel(): void {
    this.stopMessages();
    this.panelOpen.set(false);
    this.activeChatUid.set('');
  }
}
