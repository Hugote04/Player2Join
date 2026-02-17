import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './login.component.scss',
  template: `
    <div class="auth-wrapper">
      <form class="auth-card" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <h2 class="auth-title">🎮 Iniciar Sesión</h2>
        <p class="auth-subtitle">Accede a tu colección de juegos</p>

        <!-- Email -->
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="tucorreo&#64;email.com"
            [class.invalid]="loginForm.get('email')!.invalid && loginForm.get('email')!.touched"
          />
          @if (loginForm.get('email')!.hasError('required') && loginForm.get('email')!.touched) {
            <span class="field-error">El email es obligatorio</span>
          } @else if (loginForm.get('email')!.hasError('email') && loginForm.get('email')!.touched) {
            <span class="field-error">Introduce un email válido</span>
          }
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            placeholder="Tu contraseña"
            [class.invalid]="loginForm.get('password')!.invalid && loginForm.get('password')!.touched"
          />
          @if (loginForm.get('password')!.hasError('required') && loginForm.get('password')!.touched) {
            <span class="field-error">La contraseña es obligatoria</span>
          } @else if (loginForm.get('password')!.hasError('minlength') && loginForm.get('password')!.touched) {
            <span class="field-error">Mínimo 6 caracteres</span>
          }
        </div>

        <!-- Submit -->
        <button class="btn-submit" type="submit" [disabled]="loginForm.invalid">
          Entrar
        </button>

        <!-- Error global (Signal) -->
        @if (errorMessage()) {
          <p class="global-error">{{ errorMessage() }}</p>
        }

        <!-- Link a registro -->
        <p class="auth-footer">
          ¿No tienes cuenta? <a routerLink="/registro" class="link-accent">Regístrate</a>
        </p>
      </form>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signal para errores de Firebase (Check 34)
  errorMessage = signal<string | null>(null);

  // Check 4, 5, 6: Formulario de login con validaciones
  loginForm = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.getRawValue();
    try {
      await this.authService.login(email, password);
      // Check 5: Redirige al dashboard tras login exitoso
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      // Check 6: Manejo de errores Firebase con Signal
      const code = err?.code;
      if (code === 'auth/user-not-found') {
        this.errorMessage.set('No existe una cuenta con este correo.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        this.errorMessage.set('Contraseña incorrecta.');
      } else if (code === 'auth/too-many-requests') {
        this.errorMessage.set('Demasiados intentos. Espera un momento.');
      } else {
        this.errorMessage.set('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    }
  }
}