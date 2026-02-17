import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

// Firebase (Configuración para RA6 - Acceso a BD y Seguridad)
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environments';

// Interceptor (Requisito RA8 - Check 33)
import { rawgInterceptor } from './core/interceptors/rawg.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 21 Zoneless — Signals manejan la reactividad (Check 34)
    provideZonelessChangeDetection(),
    provideRouter(routes),

    // Check 33: HttpClient con interceptor RAWG
    provideHttpClient(withInterceptors([rawgInterceptor])),

    // RA6: Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};