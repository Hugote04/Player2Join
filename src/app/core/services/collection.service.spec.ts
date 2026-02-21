import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CollectionService } from './collection.service';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

describe('CollectionService', () => {
  let service: CollectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CollectionService,
        { provide: Firestore, useValue: {} },
        {
          provide: AuthService,
          useValue: {
            currentUserSig: vi.fn(() => null),
            isAuthenticated: vi.fn(() => false),
          },
        },
      ],
    });
    service = TestBed.inject(CollectionService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('savedIds inicia como Set vacío', () => {
    expect(service.savedIds().size).toBe(0);
  });

  it('hiddenIds inicia como Set vacío', () => {
    expect(service.hiddenIds().size).toBe(0);
  });

  it('isSaved() devuelve false con colección vacía', () => {
    expect(service.isSaved('12345')).toBe(false);
  });

  it('isSaved() devuelve true si el ID está en savedIds', () => {
    service.savedIds.set(new Set(['42']));
    expect(service.isSaved('42')).toBe(true);
  });

  it('isSaved() devuelve false para un ID distinto', () => {
    service.savedIds.set(new Set(['42']));
    expect(service.isSaved('99')).toBe(false);
  });

  it('isHidden() devuelve false con hiddenIds vacío', () => {
    expect(service.isHidden('100')).toBe(false);
  });

  it('isHidden() devuelve true si el ID está oculto', () => {
    service.hiddenIds.set(new Set(['100']));
    expect(service.isHidden('100')).toBe(true);
  });

  it('loadUserCollection devuelve vacío sin usuario autenticado', async () => {
    const result = await service.loadUserCollection();
    expect(result).toEqual([]);
  });
});
