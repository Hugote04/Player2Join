import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  styleUrl: './profile.component.scss',
  template: `
    <section class="profile-page">
      @if (loading()) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      }

      @if (!loading() && profile()) {
        <div class="profile-card">
          <h2 class="profile-title">👤 Mi Perfil</h2>

          <!-- Avatar actual -->
          <div class="avatar-section">
            <div class="avatar-preview large">
              @if (photoPreview() || profile()!.photoURL) {
                <img [src]="photoPreview() || profile()!.photoURL" alt="Avatar" />
              } @else {
                <span class="avatar-placeholder">📷</span>
              }
            </div>

            <!-- Selector desplegable para cambiar foto -->
            <div class="avatar-picker">
              <button type="button" class="btn-avatar-toggle" (click)="togglePhotoMenu()">
                Cambiar foto ▾
              </button>
              @if (showPhotoMenu()) {
                <div class="avatar-dropdown">
                  <button type="button" (click)="selectPhotoMode('file')">📁 Subir imagen local</button>
                  <button type="button" (click)="selectPhotoMode('url')">🔗 Usar URL de imagen</button>
                </div>
              }
            </div>

            @if (photoMode() === 'url') {
              <input
                type="url"
                class="photo-url-input"
                placeholder="https://ejemplo.com/mi-avatar.png"
                [value]="photoPreview() ?? ''"
                (input)="onPhotoUrlChange($event)"
              />
            }

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

          <!-- Formulario editable -->
          <form [formGroup]="editForm" (ngSubmit)="onSave()">
            <div class="form-group">
              <label for="username">Nombre Gamer</label>
              <input
                id="username"
                type="text"
                formControlName="username"
                [class.invalid]="editForm.get('username')!.invalid && editForm.get('username')!.touched"
              />
              @if (editForm.get('username')!.hasError('required') && editForm.get('username')!.touched) {
                <span class="field-error">El nombre es obligatorio</span>
              }
              @if (editForm.get('username')!.hasError('minlength') && editForm.get('username')!.touched) {
                <span class="field-error">Mínimo 3 caracteres</span>
              }
            </div>

            <div class="form-group">
              <label>Email</label>
              <input type="email" [value]="profile()!.email" disabled class="disabled-input" />
              <span class="field-hint">El email no se puede cambiar</span>
            </div>

            <button class="btn-save" type="submit" [disabled]="editForm.invalid || saving()">
              {{ saving() ? 'Guardando...' : '💾 Guardar cambios' }}
            </button>

            @if (successMsg()) {
              <p class="success-msg">{{ successMsg() }}</p>
            }
            @if (errorMsg()) {
              <p class="error-msg">{{ errorMsg() }}</p>
            }
          </form>
        </div>
      }
    </section>
  `
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  // Signals
  profile = signal<UserProfile | null>(null);
  loading = signal(false);
  saving = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);
  photoPreview = signal<string | null>(null);
  photoMode = signal<'none' | 'url' | 'file'>('none');
  showPhotoMenu = signal(false);

  editForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
  });

  async ngOnInit() {
    const user = this.authService.currentUserSig();
    if (!user) return;

    this.loading.set(true);
    const prof = await this.profileService.loadProfile(user.uid);
    if (prof) {
      this.profile.set(prof);
      this.editForm.patchValue({ username: prof.username });
    }
    this.loading.set(false);
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

  async onSave() {
    if (this.editForm.invalid) return;

    const user = this.authService.currentUserSig();
    if (!user) return;

    this.saving.set(true);
    this.successMsg.set(null);
    this.errorMsg.set(null);

    try {
      const updates: any = {
        username: this.editForm.value.username,
      };

      // Solo actualizar foto si se ha cambiado
      if (this.photoPreview()) {
        if (!this.profileService.validatePhoto(this.photoPreview()!)) {
          this.errorMsg.set('La imagen es demasiado grande. Máximo 800 KB.');
          this.saving.set(false);
          return;
        }
        updates.photoURL = this.photoPreview();
      }

      await this.profileService.updateProfile(user.uid, updates);

      // Refrescar perfil local
      this.profile.update(prev => prev ? { ...prev, ...updates } : prev);
      this.successMsg.set('¡Perfil actualizado correctamente!');
      this.photoMode.set('none');
    } catch {
      this.errorMsg.set('Error al guardar. Inténtalo de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
}
