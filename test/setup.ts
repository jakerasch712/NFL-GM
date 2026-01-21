import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Math.random for deterministic tests
export const mockRandom = (value: number) => {
  vi.spyOn(Math, 'random').mockReturnValue(value);
};

// Reset all mocks after each test
afterEach(() => {
  vi.restoreAllMocks();
});
