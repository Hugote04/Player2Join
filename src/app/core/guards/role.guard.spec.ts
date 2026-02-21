import { describe, it, expect } from 'vitest';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  it('debe ser una función', () => {
    expect(typeof roleGuard).toBe('function');
  });
});
