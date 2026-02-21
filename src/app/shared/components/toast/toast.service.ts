import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error';
}

/**
 * Servicio global para mostrar mensajes toast de éxito/error.
 * Proporciona feedback visual tras operaciones CRUD (Check 30).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Toast actualmente visible (null = oculto) */
  current = signal<Toast | null>(null);

  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Muestra un toast de éxito */
  success(message: string, duration = 3000): void {
    this.show({ message, type: 'success' }, duration);
  }

  /** Muestra un toast de error */
  error(message: string, duration = 4000): void {
    this.show({ message, type: 'error' }, duration);
  }

  /** Limpia el toast actual */
  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.current.set(null);
  }

  private show(toast: Toast, duration: number): void {
    this.clear();
    this.current.set(toast);
    this.timer = setTimeout(() => this.current.set(null), duration);
  }
}
