import { HttpInterceptorFn } from '@angular/common/http';

/**
 * AuthInterceptor — Añade automáticamente el JWT de Firebase
 * como Bearer token a todas las peticiones HTTP (Check 33).
 *
 * Lee el token almacenado en localStorage bajo la clave 'p2j_token'.
 * Solo lo adjunta si el token existe.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('p2j_token');

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }

  return next(req);
};
