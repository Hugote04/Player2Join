import { inject, Injectable, signal } from '@angular/core';
import { 
  Auth, 
  user, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User 
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ProfileService } from './profile.service';
import { NotificationService } from './notification.service';

/** Clave para almacenar el JWT en localStorage (Check 5) */
const JWT_KEY = 'p2j_token';

/**
 * AuthService — Gestiona la autenticación con Firebase Auth.
 *
 * Proporciona métodos de login, registro y logout, y expone el
 * estado reactivo del usuario con Signals (RA8 - Check 34).
 *
 * @remarks
 * El JWT de Firebase se almacena en localStorage para que
 * el AuthInterceptor lo adjunte a las peticiones HTTP.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);

  /** Signal reactivo con el usuario de Firebase (Check 34) */
  currentUserSig = signal<User | null | undefined>(undefined);

  /** Signal con el rol del usuario: 'admin' | 'user' */
  roleSig = signal<'admin' | 'user'>('user');

  constructor() {
    // Escucha cambios de Firebase y actualiza el Signal automáticamente
    user(this.auth).subscribe(async (u) => {
      this.currentUserSig.set(u);
      if (u) {
        // Check 5: Almacenar JWT en localStorage
        const token = await u.getIdToken();
        localStorage.setItem(JWT_KEY, token);

        // Cargar perfil y notificaciones
        this.profileService.loadProfile(u.uid);
        this.notificationService.listenNotifications(u.uid);

        // Determinar rol: admin por email (configurable)
        this.roleSig.set(this.resolveRole(u.email));
      } else {
        // Check 7: Limpiar token y estado
        localStorage.removeItem(JWT_KEY);
        this.profileService.profileSig.set(null);
        this.notificationService.clear();
        this.roleSig.set('user');
      }
    });
  }

  /**
   * Registra un nuevo usuario con email y contraseña.
   * @param email - Correo del usuario
   * @param pass  - Contraseña (mín. 6 caracteres)
   * @returns Credencial de Firebase
   */
  register(email: string, pass: string) {
    return createUserWithEmailAndPassword(this.auth, email, pass);
  }

  /**
   * Inicia sesión con email y contraseña.
   * Actualiza el signal del usuario inmediatamente para evitar
   * race-conditions con los guards de ruta.
   * @param email - Correo del usuario
   * @param pass  - Contraseña
   * @returns Credencial de Firebase
   */
  async login(email: string, pass: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, pass);
    // Actualizar signal inmediatamente para que authGuard lo vea
    this.currentUserSig.set(cred.user);
    this.roleSig.set(this.resolveRole(cred.user.email));
    return cred;
  }

  /**
   * Cierra sesión, elimina el JWT y redirige a /login.
   */
  logout() {
    return signOut(this.auth).then(() => {
      localStorage.removeItem(JWT_KEY);
      this.router.navigate(['/login']);
    });
  }

  /** Devuelve true si el usuario está autenticado */
  isAuthenticated(): boolean {
    return !!this.currentUserSig();
  }

  /** Devuelve true si el usuario tiene rol admin */
  isAdmin(): boolean {
    return this.roleSig() === 'admin';
  }

  /** Obtiene el JWT almacenado en localStorage */
  getToken(): string | null {
    return localStorage.getItem(JWT_KEY);
  }

  /**
   * Resuelve el rol del usuario basado en email.
   * Los admins se definen por un listado de correos conocidos.
   */
  private resolveRole(email: string | null): 'admin' | 'user' {
    const adminEmails = [
      'admin@player2join.com',
      'marinohugo07@gmail.com'
    ];
    return email && adminEmails.includes(email) ? 'admin' : 'user';
  }
}