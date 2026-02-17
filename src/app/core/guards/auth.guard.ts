import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario está logueado (Signal tiene datos), permite pasar
  if (authService.isAuthenticated()) {
    return true;
  } else {
    // Si no, redirige al login (Check 9)
    router.navigate(['/login']);
    return false;
  }
};