import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
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
    // Mantenemos la detección de cambios optimizada
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    // Check 33: Configuramos HttpClient con el interceptor de la API RAWG
    provideHttpClient(withInterceptors([rawgInterceptor])),
    
    // RA6: Inicializamos Firebase con las variables de entorno configuradas (Check 36)
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};