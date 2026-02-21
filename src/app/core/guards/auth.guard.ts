import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * AuthGuard — Protege rutas que requieren autenticación.
 *
 * Comprueba `AuthService.currentUserSig()` para determinar si
 * el usuario está autenticado. Si el signal aún es `undefined`
 * (Firebase cargando), espera a que se resuelva mediante un Observable.
 *
 * - Si hay usuario autenticado: permite el acceso.
 * - Si no: redirige a `/login` (RA6 - Check 6).
 *
 * @param route - Instantánea de la ruta activada
 * @param state - Estado del router
 * @returns `true` o un `UrlTree` de redirección
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya se resolvió el estado, decidir inmediatamente
  const current = authService.currentUserSig();
  if (current !== undefined) {
    if (current) return true;
    router.navigate(['/login']);
    return false;
  }

  // Si aún es undefined (cargando), esperar a que Firebase resuelva
  return toObservable(authService.currentUserSig).pipe(
    filter(u => u !== undefined),   // esperar a que deje de ser "cargando"
    take(1),
    map(u => {
      if (u) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};