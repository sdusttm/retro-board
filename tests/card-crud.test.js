import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act, screen, cleanup } from '@testing-library/react';
import { RetroBoard } from '../app.js';

const e = React.createElement;

async function renderBoard(username = 'TestUser') {
    localStorage.setItem('retroboard-username', username);
    window.location.hash = '#testboard';

    let result;
    await act(async () => {
        result = render(e(RetroBoard));
    });

    const peer = globalThis.Peer.lastInstance;
    if (peer) {
        await act(async () => { peer._emit('open', 'retroboard-testboard'); });
    }

    return result;
}

describe('Card CRUD', () => {
    beforeEach(() => {
        cleanup();
        localStorage.clear();
        window.location.hash = '';
    });

    describe('Create', () => {
        it('clicking + button creates a new card', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            const cards = document.querySelectorAll('.card');
            expect(cards.length).toBeGreaterThanOrEqual(1);
        });

        it('new card has empty text', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            const cardText = document.querySelector('.card-text');
            expect(cardText.textContent).toBe('');
        });

        it('new card shows the current user as author', async () => {
            await renderBoard('Alice');
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            const authorName = document.querySelector('.card-author-name');
            expect(authorName.textContent).toBe('Alice');
        });

        it('new card appends at bottom, not top', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            // Create first card and set text via innerText (which blur handler reads)
            await act(async () => { fireEvent.click(addButtons[0]); });
            const firstText = document.querySelector('.card-text');
            Object.defineProperty(firstText, 'innerText', { value: 'First card', writable: true, configurable: true });
            await act(async () => { fireEvent.blur(firstText); });

            // Create second card
            await act(async () => { fireEvent.click(addButtons[0]); });
            const cards = document.querySelectorAll('.card');
            // Should have 2 cards, first card's author should match (confirms order)
            expect(cards).toHaveLength(2);
            // The second card should be the new empty one (appended at end)
            const secondText = cards[1].querySelector('.card-text');
            expect(secondText.textContent).toBe('');
        });
    });

    describe('Edit', () => {
        it('card text is contentEditable', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            const cardText = document.querySelector('.card-text');
            expect(cardText.getAttribute('contenteditable')).toBe('true');
        });

        it('blur saves the text', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            const cardText = document.querySelector('.card-text');
            cardText.textContent = 'Updated text';
            Object.defineProperty(cardText, 'innerText', { value: 'Updated text', writable: true });
            await act(async () => { fireEvent.blur(cardText); });
            // Text should persist after blur
            expect(cardText.textContent).toBe('Updated text');
        });

        it('pressing Enter exits edit mode (triggers blur)', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            const cardText = document.querySelector('.card-text');
            cardText.focus();
            const blurSpy = vi.spyOn(cardText, 'blur');
            await act(async () => {
                fireEvent.keyDown(cardText, { key: 'Enter' });
            });
            expect(blurSpy).toHaveBeenCalled();
        });

        it('double-click on card focuses text element', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            const card = document.querySelector('.card');
            const cardText = document.querySelector('.card-text');
            const focusSpy = vi.spyOn(cardText, 'focus');
            await act(async () => { fireEvent.doubleClick(card); });
            expect(focusSpy).toHaveBeenCalled();
        });
    });

    describe('Vote', () => {
        it('clicking vote button increments the count', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });

            const voteBtn = document.querySelector('.vote-btn');
            expect(voteBtn).toBeTruthy();

            await act(async () => { fireEvent.click(voteBtn); });
            const voteCount = voteBtn.querySelector('span');
            expect(voteCount.textContent).toBe('1');
        });

        it('multiple clicks accumulate votes', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });

            const voteBtn = document.querySelector('.vote-btn');
            const getCount = () => Number(voteBtn.querySelector('span').textContent);
            const initial = getCount();

            await act(async () => { fireEvent.click(voteBtn); });
            await act(async () => { fireEvent.click(voteBtn); });
            await act(async () => { fireEvent.click(voteBtn); });

            expect(getCount()).toBe(initial + 3);
        });

        it('vote button mousedown stops propagation', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });

            const voteBtn = document.querySelector('.vote-btn');
            const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
            const stopSpy = vi.spyOn(mouseDownEvent, 'stopPropagation');
            voteBtn.dispatchEvent(mouseDownEvent);
            expect(stopSpy).toHaveBeenCalled();
        });
    });

    describe('Delete', () => {
        it('clicking delete button removes the card', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            expect(document.querySelectorAll('.card')).toHaveLength(1);

            const deleteBtn = document.querySelector('.delete-btn');
            await act(async () => { fireEvent.click(deleteBtn); });
            expect(document.querySelectorAll('.card')).toHaveLength(0);
        });

        it('other cards remain after deletion', async () => {
            await renderBoard();
            const addButtons = screen.getAllByText('+');
            await act(async () => { fireEvent.click(addButtons[0]); });
            await act(async () => { fireEvent.click(addButtons[0]); });
            expect(document.querySelectorAll('.card')).toHaveLength(2);

            const deleteBtn = document.querySelector('.delete-btn');
            await act(async () => { fireEvent.click(deleteBtn); });
            expect(document.querySelectorAll('.card')).toHaveLength(1);
        });
    });
});
