import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * ErrorInterceptor — Intercepta errores HTTP globales (Check 30).
 *
 * - 401: Token expirado o no autenticado → redirige a /login
 * - 403: Sin permisos
 * - Otros: Se dejan propagar para que los componentes los manejen
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('p2j_token');
        router.navigate(['/login']);
      }

      if (error.status === 0) {
        console.error('Error de red — no se pudo conectar al servidor.');
      }

      return throwError(() => error);
    })
  );
};
