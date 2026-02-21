import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('current() inicia como null', () => {
    expect(service.current()).toBeNull();
  });

  it('success() muestra toast de tipo success', () => {
    service.success('Guardado');
    expect(service.current()).toEqual({ message: 'Guardado', type: 'success' });
  });

  it('error() muestra toast de tipo error', () => {
    service.error('Falló');
    expect(service.current()).toEqual({ message: 'Falló', type: 'error' });
  });

  it('clear() oculta el toast', () => {
    service.success('Test');
    service.clear();
    expect(service.current()).toBeNull();
  });
});
