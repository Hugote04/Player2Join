import { describe, it, expect } from 'vitest';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('debe ser una función', () => {
    expect(typeof authGuard).toBe('function');
  });
});
