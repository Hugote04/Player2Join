import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * RoleGuard — Protege rutas que solo deben ser accesibles por administradores.
 *
 * Espera a que Firebase resuelva el estado de autenticación y luego
 * comprueba si el usuario tiene rol 'admin'. Si no es admin, redirige
 * a /home. (RA6 - Check 10)
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el estado ya se resolvió, decidir inmediatamente
  const current = authService.currentUserSig();
  if (current !== undefined) {
    if (current && authService.isAdmin()) return true;
    router.navigate([current ? '/home' : '/login']);
    return false;
  }

  // Si aún está cargando, esperar a que Firebase resuelva
  return toObservable(authService.currentUserSig).pipe(
    filter(u => u !== undefined),
    take(1),
    map(u => {
      if (u && authService.isAdmin()) return true;
      router.navigate([u ? '/home' : '/login']);
      return false;
    })
  );
};
