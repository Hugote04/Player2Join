import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Firestore } from '@angular/fire/firestore';

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(GameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('customGamesSig inicia como array vacío', () => {
    expect(service.customGamesSig()).toEqual([]);
  });

  it('getGames() hace GET paginado a RAWG', () => {
    const mockRes = { results: [{ id: 1, name: 'Test Game' }], count: 1 };

    service.getGames(1, 20).subscribe(res => {
      expect(res.results.length).toBe(1);
      expect(res.results[0].name).toBe('Test Game');
    });

    const req = httpMock.expectOne(r => r.url.includes('api.rawg.io/api/games'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('page_size')).toBe('20');
    req.flush(mockRes);
  });

  it('searchGames() incluye el query en los params', () => {
    service.searchGames('zelda', 2, 10).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('api.rawg.io/api/games') && r.params.get('search') === 'zelda'
    );
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('10');
    req.flush({ results: [], count: 0 });
  });

  it('getGameById() hace GET con el id correcto', () => {
    service.getGameById('42').subscribe(game => {
      expect(game.id).toBe(42);
    });

    const req = httpMock.expectOne(r => r.url.includes('api.rawg.io/api/games/42'));
    expect(req.request.method).toBe('GET');
    req.flush({ id: 42, name: 'Portal 2' });
  });

  it('getGameScreenshots() hace GET a /screenshots', () => {
    service.getGameScreenshots('42').subscribe(data => {
      expect(data.results.length).toBe(2);
    });

    const req = httpMock.expectOne(r => r.url.includes('api.rawg.io/api/games/42/screenshots'));
    req.flush({ results: [{ id: 1 }, { id: 2 }] });
  });
});
