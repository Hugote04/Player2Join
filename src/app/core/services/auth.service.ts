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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);

  // RA8 - Check 34: Estado de autenticación reactivo con Signals
  currentUserSig = signal<User | null | undefined>(undefined);

  constructor() {
    // Escucha cambios de Firebase y actualiza el Signal automáticamente
    user(this.auth).subscribe((u) => {
      this.currentUserSig.set(u);
      // Cargar perfil de Firestore al detectar usuario
      if (u) {
        this.profileService.loadProfile(u.uid);
        this.notificationService.listenNotifications(u.uid);
      } else {
        this.profileService.profileSig.set(null);
        this.notificationService.clear();
      }
    });
  }

  // RA6 - Check 1: Registro
  register(email: string, pass: string) {
    return createUserWithEmailAndPassword(this.auth, email, pass);
  }

  // RA6 - Check 4: Login
  login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  // RA6 - Check 7: Logout
  logout() {
    return signOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
  }

  // Check 31: Método rápido para saber si está autenticado
  isAuthenticated(): boolean {
    return !!this.currentUserSig();
  }
}