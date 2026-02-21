import { Injectable } from '@angular/core';

/**
 * StorageService — Abstracción sobre localStorage para
 * almacenamiento de datos del lado del cliente.
 *
 * Proporciona métodos seguros con try/catch para entornos
 * donde localStorage puede no estar disponible (SSR).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {

  /** Guarda un valor en localStorage */
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch { /* SSR safe */ }
  }

  /** Obtiene un valor de localStorage */
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /** Elimina un valor de localStorage */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch { /* SSR safe */ }
  }

  /** Guarda un objeto JSON en localStorage */
  setObject<T>(key: string, value: T): void {
    this.set(key, JSON.stringify(value));
  }

  /** Obtiene un objeto JSON de localStorage */
  getObject<T>(key: string): T | null {
    const raw = this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /** Limpia todo el localStorage */
  clear(): void {
    try {
      localStorage.clear();
    } catch { /* SSR safe */ }
  }
}
