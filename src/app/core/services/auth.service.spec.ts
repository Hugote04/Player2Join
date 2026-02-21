import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ProfileService } from './profile.service';
import { NotificationService } from './notification.service';

/**
 * Mock mínimo de Auth que expone onAuthStateChanged para que
 * el constructor de AuthService (que llama a user(auth)) no falle.
 */
const mockAuth = {
  onAuthStateChanged: vi.fn((_cb: any) => () => {}),
  currentUser: null,
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.removeItem('p2j_token');

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ProfileService, useValue: { loadProfile: vi.fn(), profileSig: { set: vi.fn() } } },
        { provide: NotificationService, useValue: { listenNotifications: vi.fn(), clear: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('currentUserSig inicia como undefined', () => {
    expect(service.currentUserSig()).toBeUndefined();
  });

  it('roleSig inicia como "user"', () => {
    expect(service.roleSig()).toBe('user');
  });

  it('isAuthenticated() devuelve false sin usuario', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAdmin() devuelve false sin usuario', () => {
    expect(service.isAdmin()).toBe(false);
  });

  it('getToken() devuelve null sin sesión', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken() devuelve el token almacenado', () => {
    localStorage.setItem('p2j_token', 'test-jwt');
    expect(service.getToken()).toBe('test-jwt');
    localStorage.removeItem('p2j_token');
  });

  it('roleSig se puede establecer a admin', () => {
    service.roleSig.set('admin');
    expect(service.isAdmin()).toBe(true);
  });
});
