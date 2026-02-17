import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <h2>🎮 Únete a Player2Join</h2>
      <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
        <input type="text" formControlName="nombre" placeholder="Nombre de Jugador">
        <input type="email" formControlName="email" placeholder="Correo electrónico">
        <input type="password" formControlName="password" placeholder="Contraseña (mín. 6 caracteres)">
        
        <button type="submit" [disabled]="registerForm.invalid">Crear Cuenta</button>
      </form>
      @if (error()) { <p class="error">{{ error() }}</p> }
    </div>
  `
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  error = signal<string | null>(null);

  // Check 202: Validaciones básicas exigidas
  registerForm = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onRegister() {
    const { email, password } = this.registerForm.getRawValue();
    try {
      // Check 203: Registro exitoso y redirección
      await this.authService.register(email!, password!);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error.set("Error al crear la cuenta. Inténtalo de nuevo.");
    }
  }
}