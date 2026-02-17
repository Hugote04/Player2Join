import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './registro.component.scss',
  template: `
    <div class="auth-wrapper">
      <form class="auth-card" [formGroup]="registerForm" (ngSubmit)="onRegister()">
        <h2 class="auth-title">🎮 Únete a Player2Join</h2>
        <p class="auth-subtitle">Crea tu perfil de jugador</p>

        <!-- Nombre -->
        <div class="form-group">
          <label for="nombre">Nombre de Jugador</label>
          <input
            id="nombre"
            type="text"
            formControlName="nombre"
            placeholder="Ej: ShadowGamer99"
            [class.invalid]="registerForm.get('nombre')!.invalid && registerForm.get('nombre')!.touched"
          />
          @if (registerForm.get('nombre')!.hasError('required') && registerForm.get('nombre')!.touched) {
            <span class="field-error">El nombre es obligatorio</span>
          }
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="tucorreo&#64;email.com"
            [class.invalid]="registerForm.get('email')!.invalid && registerForm.get('email')!.touched"
          />
          @if (registerForm.get('email')!.hasError('required') && registerForm.get('email')!.touched) {
            <span class="field-error">El email es obligatorio</span>
          } @else if (registerForm.get('email')!.hasError('email') && registerForm.get('email')!.touched) {
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
            placeholder="Mínimo 6 caracteres"
            [class.invalid]="registerForm.get('password')!.invalid && registerForm.get('password')!.touched"
          />
          @if (registerForm.get('password')!.hasError('required') && registerForm.get('password')!.touched) {
            <span class="field-error">La contraseña es obligatoria</span>
          } @else if (registerForm.get('password')!.hasError('minlength') && registerForm.get('password')!.touched) {
            <span class="field-error">Mínimo 6 caracteres</span>
          }
        </div>

        <!-- Submit -->
        <button class="btn-submit" type="submit" [disabled]="registerForm.invalid">
          Crear Cuenta
        </button>

        <!-- Error global -->
        @if (errorMsg()) {
          <p class="global-error">{{ errorMsg() }}</p>
        }

        <!-- Link a login -->
        <p class="auth-footer">
          ¿Ya tienes cuenta? <a routerLink="/login" class="link-accent">Inicia sesión</a>
        </p>
      </form>
    </div>
  `
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signal para errores de Firebase (Check 34)
  errorMsg = signal<string | null>(null);

  // Reactive Form con validaciones (Check 1, 2, 3)
  registerForm = this.fb.group({
    nombre:   ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onRegister() {
    if (this.registerForm.invalid) return;

    const { email, password } = this.registerForm.getRawValue();
    try {
      await this.authService.register(email!, password!);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      // Mensajes traducidos de Firebase
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        this.errorMsg.set('Este correo ya está registrado.');
      } else if (code === 'auth/weak-password') {
        this.errorMsg.set('La contraseña es demasiado débil.');
      } else {
        this.errorMsg.set('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    }
  }
}