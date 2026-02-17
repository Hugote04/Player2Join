import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-box">
      <h2>🎮 Player2Join Login</h2>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <input type="email" formControlName="email" placeholder="Email">
        <input type="password" formControlName="password" placeholder="Contraseña">
        <button type="submit" [disabled]="loginForm.invalid">Entrar</button>
      </form>
      @if (errorMessage()) { <p style="color: red;">{{ errorMessage() }}</p> }
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = signal<string | null>(null);

  // Check 4: Formulario de login (RA6)
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    const { email, password } = this.loginForm.getRawValue();
    this.authService.login(email, password)
      .then(() => {
        // Check 203: Redirige al dashboard tras login exitoso
        this.router.navigate(['/dashboard']);
      })
      .catch(err => this.errorMessage.set('Error: Credenciales incorrectas'));
  }
}