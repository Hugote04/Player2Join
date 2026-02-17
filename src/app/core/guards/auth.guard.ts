import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

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