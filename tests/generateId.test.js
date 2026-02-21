import { describe, it, expect } from 'vitest';
import { generateId } from '../app.js';

describe('generateId', () => {
    it('returns a string', () => {
        expect(typeof generateId()).toBe('string');
    });

    it('returns a string of length 7', () => {
        expect(generateId()).toHaveLength(7);
    });

    it('returns only alphanumeric characters', () => {
        for (let i = 0; i < 50; i++) {
            expect(generateId()).toMatch(/^[a-z0-9]+$/);
        }
    });

    it('returns unique values across calls', () => {
        const ids = new Set();
        for (let i = 0; i < 100; i++) {
            ids.add(generateId());
        }
        expect(ids.size).toBe(100);
    });
});
