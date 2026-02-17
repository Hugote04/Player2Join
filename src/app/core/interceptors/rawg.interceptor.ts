import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environments';

export const rawgInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo aplicamos el interceptor si la URL es de la API de RAWG
  if (req.url.includes('api.rawg.io')) {
    const cloneReq = req.clone({
      setParams: { key: environment.rawgKey }
    });
    return next(cloneReq);
  }
  return next(req);
};