import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
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

        <!-- Foto de perfil -->
        <div class="avatar-section">
          <div class="avatar-preview">
            @if (photoPreview()) {
              <img [src]="photoPreview()" alt="Avatar" />
            } @else {
              <span class="avatar-placeholder">📷</span>
            }
          </div>

          <!-- Selector desplegable -->
          <div class="avatar-picker">
            <button type="button" class="btn-avatar-toggle" (click)="togglePhotoMenu()">
              {{ photoMode() === 'none' ? 'Añadir foto' : photoMode() === 'url' ? 'Foto por URL' : 'Foto local' }} ▾
            </button>
            @if (showPhotoMenu()) {
              <div class="avatar-dropdown">
                <button type="button" (click)="selectPhotoMode('file')">📁 Subir imagen local</button>
                <button type="button" (click)="selectPhotoMode('url')">🔗 Usar URL de imagen</button>
              </div>
            }
          </div>

          <!-- Input URL -->
          @if (photoMode() === 'url') {
            <input
              type="url"
              class="photo-url-input"
              placeholder="https://ejemplo.com/mi-avatar.png"
              (input)="onPhotoUrlChange($event)"
            />
          }

          <!-- Input File (oculto, se abre con botón) -->
          @if (photoMode() === 'file') {
            <input
              #fileInput
              type="file"
              accept="image/*"
              class="file-hidden"
              (change)="onFileSelected($event)"
            />
            <button type="button" class="btn-file" (click)="fileInput.click()">
              Seleccionar archivo
            </button>
          }
        </div>

        <!-- Nombre Gamer -->
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
          @if (registerForm.get('nombre')!.hasError('minlength') && registerForm.get('nombre')!.touched) {
            <span class="field-error">Mínimo 3 caracteres</span>
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

        <!-- Confirmar contraseña -->
        <div class="form-group">
          <label for="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            formControlName="confirmPassword"
            placeholder="Repite tu contraseña"
            [class.invalid]="registerForm.get('confirmPassword')!.invalid && registerForm.get('confirmPassword')!.touched"
          />
          @if (registerForm.get('confirmPassword')!.hasError('required') && registerForm.get('confirmPassword')!.touched) {
            <span class="field-error">Debes confirmar la contraseña</span>
          }
          @if (registerForm.hasError('passwordsMismatch') && registerForm.get('confirmPassword')!.touched) {
            <span class="field-error">Las contraseñas no coinciden</span>
          }
        </div>

        <!-- Submit -->
        <button class="btn-submit" type="submit" [disabled]="registerForm.invalid || submitting()">
          {{ submitting() ? 'Creando...' : 'Crear Cuenta' }}
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
  private profileService = inject(ProfileService);
  private router = inject(Router);

  // Signals
  errorMsg = signal<string | null>(null);
  submitting = signal(false);
  photoPreview = signal<string | null>(null);
  photoMode = signal<'none' | 'url' | 'file'>('none');
  showPhotoMenu = signal(false);

  // Reactive Form con validaciones
  // Check 2: Validaciones — email válido, password min 6, contraseñas coinciden
  registerForm = this.fb.group({
    nombre:          ['', [Validators.required, Validators.minLength(3)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordsMatchValidator });

  /** Validador de grupo — confirma que password y confirmPassword coinciden */
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordsMismatch: true };
  }

  togglePhotoMenu() {
    this.showPhotoMenu.update(v => !v);
  }

  selectPhotoMode(mode: 'url' | 'file') {
    this.photoMode.set(mode);
    this.showPhotoMenu.set(false);
    this.photoPreview.set(null);
  }

  onPhotoUrlChange(event: Event) {
    const val = (event.target as HTMLInputElement).value.trim();
    this.photoPreview.set(val || null);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validar tamaño antes de leer (max 800 KB)
    if (file.size > 800 * 1024) {
      this.errorMsg.set('La imagen es demasiado grande. Máximo 800 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview.set(reader.result as string);
      this.errorMsg.set(null);
    };
    reader.readAsDataURL(file);
  }

  async onRegister() {
    if (this.registerForm.invalid) return;

    this.submitting.set(true);
    this.errorMsg.set(null);
    const { nombre, email, password } = this.registerForm.getRawValue();

    // Validar foto si es base64
    const photo = this.photoPreview() ?? '';
    if (photo && !this.profileService.validatePhoto(photo)) {
      this.errorMsg.set('La imagen es demasiado grande. Máximo 800 KB.');
      this.submitting.set(false);
      return;
    }

    try {
      const cred = await this.authService.register(email!, password!);

      // Guardar perfil en Firestore: username, email, photoURL
      await this.profileService.createProfile(cred.user.uid, {
        username: nombre!,
        email: email!,
        photoURL: photo,
      });

      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        this.errorMsg.set('Este correo ya está registrado.');
      } else if (code === 'auth/weak-password') {
        this.errorMsg.set('La contraseña es demasiado débil.');
      } else {
        this.errorMsg.set('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      this.submitting.set(false);
    }
  }
}