import { describe, it, expect, vi } from 'vitest';
import { applyAction } from '../app.js';

const emptyState = () => ({
    'went-well': [],
    'to-improve': [],
    'action-items': []
});

const stateWith = (column, cards) => {
    const s = emptyState();
    s[column] = cards;
    return s;
};

const card = (id, text = '', votes = 0, author = 'Bob') => ({
    id, text, votes, author, timestamp: 1000
});

describe('applyAction', () => {
    describe('CREATE', () => {
        it('creates a new card in the specified column', () => {
            const result = applyAction(emptyState(), {
                type: 'CREATE', columnId: 'went-well', cardId: 'c1', author: 'Alice'
            });
            expect(result['went-well']).toHaveLength(1);
            expect(result['went-well'][0].id).toBe('c1');
        });

        it('appends card at the end, not beginning', () => {
            const state = stateWith('went-well', [card('c1', 'first')]);
            const result = applyAction(state, {
                type: 'CREATE', columnId: 'went-well', cardId: 'c2', author: 'Alice'
            });
            expect(result['went-well'][0].id).toBe('c1');
            expect(result['went-well'][1].id).toBe('c2');
        });

        it('new card has empty text, 0 votes, correct author', () => {
            const result = applyAction(emptyState(), {
                type: 'CREATE', columnId: 'to-improve', cardId: 'c1', author: 'Bob'
            });
            const c = result['to-improve'][0];
            expect(c.text).toBe('');
            expect(c.votes).toBe(0);
            expect(c.author).toBe('Bob');
        });

        it('does not modify other columns', () => {
            const state = stateWith('to-improve', [card('existing')]);
            const result = applyAction(state, {
                type: 'CREATE', columnId: 'went-well', cardId: 'c1', author: 'A'
            });
            expect(result['to-improve']).toEqual([card('existing')]);
            expect(result['action-items']).toEqual([]);
        });
    });

    describe('UPDATE', () => {
        it('updates text of the correct card', () => {
            const state = stateWith('went-well', [card('c1', 'old')]);
            const result = applyAction(state, {
                type: 'UPDATE', columnId: 'went-well', cardId: 'c1', text: 'new text'
            });
            expect(result['went-well'][0].text).toBe('new text');
        });

        it('preserves other card properties', () => {
            const state = stateWith('went-well', [card('c1', 'old', 5, 'Alice')]);
            const result = applyAction(state, {
                type: 'UPDATE', columnId: 'went-well', cardId: 'c1', text: 'new'
            });
            expect(result['went-well'][0].votes).toBe(5);
            expect(result['went-well'][0].author).toBe('Alice');
        });

        it('does not modify other cards', () => {
            const state = stateWith('went-well', [card('c1', 'a'), card('c2', 'b')]);
            const result = applyAction(state, {
                type: 'UPDATE', columnId: 'went-well', cardId: 'c1', text: 'changed'
            });
            expect(result['went-well'][1].text).toBe('b');
        });

        it('handles non-existent card gracefully', () => {
            const state = stateWith('went-well', [card('c1')]);
            const result = applyAction(state, {
                type: 'UPDATE', columnId: 'went-well', cardId: 'nonexistent', text: 'x'
            });
            expect(result['went-well']).toHaveLength(1);
        });
    });

    describe('VOTE', () => {
        it('increments vote count by 1', () => {
            const state = stateWith('went-well', [card('c1', 'text', 0)]);
            const result = applyAction(state, {
                type: 'VOTE', columnId: 'went-well', cardId: 'c1'
            });
            expect(result['went-well'][0].votes).toBe(1);
        });

        it('accumulates multiple votes', () => {
            let state = stateWith('went-well', [card('c1', 'text', 0)]);
            state = applyAction(state, { type: 'VOTE', columnId: 'went-well', cardId: 'c1' });
            state = applyAction(state, { type: 'VOTE', columnId: 'went-well', cardId: 'c1' });
            state = applyAction(state, { type: 'VOTE', columnId: 'went-well', cardId: 'c1' });
            expect(state['went-well'][0].votes).toBe(3);
        });

        it('only affects the target card', () => {
            const state = stateWith('went-well', [card('c1', '', 0), card('c2', '', 0)]);
            const result = applyAction(state, {
                type: 'VOTE', columnId: 'went-well', cardId: 'c1'
            });
            expect(result['went-well'][0].votes).toBe(1);
            expect(result['went-well'][1].votes).toBe(0);
        });
    });

    describe('DELETE', () => {
        it('removes the specified card', () => {
            const state = stateWith('went-well', [card('c1'), card('c2')]);
            const result = applyAction(state, {
                type: 'DELETE', columnId: 'went-well', cardId: 'c1'
            });
            expect(result['went-well']).toHaveLength(1);
            expect(result['went-well'][0].id).toBe('c2');
        });

        it('does not affect other columns', () => {
            const state = {
                ...emptyState(),
                'went-well': [card('c1')],
                'to-improve': [card('c2')]
            };
            const result = applyAction(state, {
                type: 'DELETE', columnId: 'went-well', cardId: 'c1'
            });
            expect(result['to-improve']).toHaveLength(1);
        });

        it('handles non-existent card gracefully', () => {
            const state = stateWith('went-well', [card('c1')]);
            const result = applyAction(state, {
                type: 'DELETE', columnId: 'went-well', cardId: 'nope'
            });
            expect(result['went-well']).toHaveLength(1);
        });

        it('column becomes empty after deleting last card', () => {
            const state = stateWith('went-well', [card('c1')]);
            const result = applyAction(state, {
                type: 'DELETE', columnId: 'went-well', cardId: 'c1'
            });
            expect(result['went-well']).toEqual([]);
        });
    });

    describe('MOVE - same column', () => {
        it('moves card from index 0 to index 2', () => {
            const state = stateWith('went-well', [card('a'), card('b'), card('c')]);
            const result = applyAction(state, {
                type: 'MOVE', cardId: 'a',
                sourceColumnId: 'went-well', destColumnId: 'went-well',
                sourceIndex: 0, destIndex: 2
            });
            expect(result['went-well'].map(c => c.id)).toEqual(['b', 'c', 'a']);
        });

        it('moves card from index 2 to index 0', () => {
            const state = stateWith('went-well', [card('a'), card('b'), card('c')]);
            const result = applyAction(state, {
                type: 'MOVE', cardId: 'c',
                sourceColumnId: 'went-well', destColumnId: 'went-well',
                sourceIndex: 2, destIndex: 0
            });
            expect(result['went-well'].map(c => c.id)).toEqual(['c', 'a', 'b']);
        });

        it('preserves card data during move', () => {
            const state = stateWith('went-well', [card('a', 'text', 5, 'Alice'), card('b')]);
            const result = applyAction(state, {
                type: 'MOVE', cardId: 'a',
                sourceColumnId: 'went-well', destColumnId: 'went-well',
                sourceIndex: 0, destIndex: 1
            });
            const moved = result['went-well'][1];
            expect(moved.text).toBe('text');
            expect(moved.votes).toBe(5);
            expect(moved.author).toBe('Alice');
        });
    });

    describe('MOVE - cross column', () => {
        it('moves card from one column to another', () => {
            const state = {
                ...emptyState(),
                'went-well': [card('a'), card('b')],
                'to-improve': [card('c')]
            };
            const result = applyAction(state, {
                type: 'MOVE', cardId: 'a',
                sourceColumnId: 'went-well', destColumnId: 'to-improve',
                sourceIndex: 0, destIndex: 1
            });
            expect(result['went-well'].map(c => c.id)).toEqual(['b']);
            expect(result['to-improve'].map(c => c.id)).toEqual(['c', 'a']);
        });

        it('preserves card data across columns', () => {
            const state = {
                ...emptyState(),
                'went-well': [card('a', 'hello', 3, 'Bob')],
                'action-items': []
            };
            const result = applyAction(state, {
                type: 'MOVE', cardId: 'a',
                sourceColumnId: 'went-well', destColumnId: 'action-items',
                sourceIndex: 0, destIndex: 0
            });
            const moved = result['action-items'][0];
            expect(moved.text).toBe('hello');
            expect(moved.votes).toBe(3);
        });

        it('inserts at correct index in destination', () => {
            const state = {
                ...emptyState(),
                'went-well': [card('a')],
                'to-improve': [card('b'), card('c')]
            };
            const result = applyAction(state, {
                type: 'MOVE', cardId: 'a',
                sourceColumnId: 'went-well', destColumnId: 'to-improve',
                sourceIndex: 0, destIndex: 1
            });
            expect(result['to-improve'].map(c => c.id)).toEqual(['b', 'a', 'c']);
        });
    });

    describe('unknown action type', () => {
        it('returns state unchanged', () => {
            const state = stateWith('went-well', [card('c1')]);
            const result = applyAction(state, { type: 'UNKNOWN' });
            expect(result['went-well']).toEqual(state['went-well']);
        });
    });
});
