import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
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

describe('Header actions', () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = '';
    });

    describe('Share Board', () => {
        it('clicking Share Board copies URL to clipboard', async () => {
            await renderBoard();
            const shareBtn = screen.getByText('Share Board');
            await act(async () => { fireEvent.click(shareBtn); });
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });

        it('shows toast notification after sharing', async () => {
            await renderBoard();
            const shareBtn = screen.getByText('Share Board');
            await act(async () => { fireEvent.click(shareBtn); });
            expect(screen.getByText('Link copied to clipboard!')).toBeInTheDocument();
        });

        it('toast disappears after 5 seconds', async () => {
            vi.useFakeTimers();
            await renderBoard();
            const shareBtn = screen.getByText('Share Board');
            await act(async () => { fireEvent.click(shareBtn); });
            expect(screen.getByText('Link copied to clipboard!')).toBeInTheDocument();

            await act(async () => { vi.advanceTimersByTime(5100); });
            expect(screen.queryByText('Link copied to clipboard!')).not.toBeInTheDocument();
            vi.useRealTimers();
        });
    });

    describe('Board display', () => {
        it('board name is displayed in header', async () => {
            await renderBoard();
            expect(document.querySelector('.board-name').textContent).toBe('Untitled Board');
        });

        it('board ID is displayed', async () => {
            await renderBoard();
            const boardId = document.querySelector('.board-id-sub');
            expect(boardId.textContent).toContain('#');
        });

        it('shows all three column headers', async () => {
            await renderBoard();
            expect(screen.getByText('WENT WELL')).toBeInTheDocument();
            expect(screen.getByText('TO IMPROVE')).toBeInTheDocument();
            expect(screen.getByText('ACTION ITEMS')).toBeInTheDocument();
        });
    });

    describe('New Board', () => {
        it('clicking New Board opens modal', async () => {
            await renderBoard();
            const newBoardBtn = screen.getByText('New Board');
            await act(async () => { fireEvent.click(newBoardBtn); });
            expect(document.querySelector('.modal-overlay.active')).toBeInTheDocument();
            expect(document.querySelector('.modal-input')).toBeInTheDocument();
        });

        it('confirming New Board saves name and navigates', async () => {
            await renderBoard();
            const newBoardBtn = screen.getByText('New Board');
            await act(async () => { fireEvent.click(newBoardBtn); });
            const input = document.querySelector('.modal-input');
            fireEvent.change(input, { target: { value: 'My Sprint Board' } });
            const confirmBtn = screen.getByText('Confirm');
            await act(async () => { fireEvent.click(confirmBtn); });
            // Should save the board name to localStorage and trigger reload
            const keys = Object.keys(localStorage).filter(k => k.startsWith('retroboard-name-'));
            const savedName = keys.length > 0 ? localStorage.getItem(keys[keys.length - 1]) : null;
            expect(savedName).toBe('My Sprint Board');
            expect(window.location.reload).toHaveBeenCalled();
        });

        it('empty name does not create new board', async () => {
            await renderBoard();
            const newBoardBtn = screen.getByText('New Board');
            await act(async () => { fireEvent.click(newBoardBtn); });
            const input = document.querySelector('.modal-input');
            fireEvent.change(input, { target: { value: '' } });
            const confirmBtn = screen.getByText('Confirm');
            const reloadCallsBefore = window.location.reload.mock.calls.length;
            await act(async () => { fireEvent.click(confirmBtn); });
            expect(window.location.reload.mock.calls.length).toBe(reloadCallsBefore);
        });
    });

    describe('Boards Panel', () => {
        it('clicking Boards button opens the panel', async () => {
            await renderBoard();
            const boardsBtn = screen.getByText('Boards');
            await act(async () => { fireEvent.click(boardsBtn); });
            expect(document.querySelector('.boards-panel.open')).toBeInTheDocument();
        });

        it('panel has boards-list container', async () => {
            await renderBoard();
            const boardsBtn = screen.getByText('Boards');
            await act(async () => { fireEvent.click(boardsBtn); });
            expect(document.querySelector('.boards-list')).toBeInTheDocument();
            expect(screen.getByText('Your Boards')).toBeInTheDocument();
        });

        it('lists boards from localStorage', async () => {
            // Pre-populate localStorage with a board
            localStorage.setItem('retroboard-state-board123', JSON.stringify({ 'went-well': [{ id: 'c1' }], 'to-improve': [], 'action-items': [] }));
            localStorage.setItem('retroboard-name-board123', 'Sprint 42');
            await renderBoard();
            const boardsBtn = screen.getByText('Boards');
            await act(async () => { fireEvent.click(boardsBtn); });
            expect(screen.getByText('Sprint 42')).toBeInTheDocument();
            expect(screen.getByText('1 card')).toBeInTheDocument();
        });

        it('clicking a different board triggers navigation', async () => {
            localStorage.setItem('retroboard-state-otherboard', JSON.stringify({ 'went-well': [], 'to-improve': [], 'action-items': [] }));
            localStorage.setItem('retroboard-name-otherboard', 'Other Board');
            await renderBoard();
            const boardsBtn = screen.getByText('Boards');
            await act(async () => { fireEvent.click(boardsBtn); });
            const boardItem = screen.getByText('Other Board').closest('.board-item');
            await act(async () => { fireEvent.click(boardItem); });
            expect(window.location.reload).toHaveBeenCalled();
        });

        it('close button closes the panel', async () => {
            await renderBoard();
            const boardsBtn = screen.getByText('Boards');
            await act(async () => { fireEvent.click(boardsBtn); });
            expect(document.querySelector('.boards-panel.open')).toBeInTheDocument();
            const closeBtn = document.querySelector('.boards-panel .close-btn');
            await act(async () => { fireEvent.click(closeBtn); });
            expect(document.querySelector('.boards-panel.open')).not.toBeInTheDocument();
        });
    });
});
