import { describe, it, expect, beforeEach } from 'vitest';
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

describe('Modal system', () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = '';
    });

    it('modal is not visible initially', async () => {
        await renderBoard();
        expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument();
    });

    it('clicking board name opens rename modal', async () => {
        await renderBoard();
        const boardName = document.querySelector('.board-name');
        await act(async () => { fireEvent.click(boardName); });
        expect(screen.getByText('Rename Board')).toBeInTheDocument();
    });

    it('rename modal has current board name as default value', async () => {
        await renderBoard();
        const boardName = document.querySelector('.board-name');
        await act(async () => { fireEvent.click(boardName); });
        const input = document.querySelector('.modal-input');
        expect(input.value).toBe('Untitled Board');
    });

    it('clicking user badge opens rename user modal', async () => {
        await renderBoard('Alice');
        const badge = document.querySelector('.user-badge');
        await act(async () => { fireEvent.click(badge); });
        expect(screen.getByText('Rename User')).toBeInTheDocument();
    });

    it('pressing Enter in modal confirms', async () => {
        await renderBoard();
        const boardName = document.querySelector('.board-name');
        await act(async () => { fireEvent.click(boardName); });
        const input = document.querySelector('.modal-input');
        fireEvent.change(input, { target: { value: 'New Name' } });
        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter' });
        });
        // Modal should close
        expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument();
        // Board name should update
        expect(document.querySelector('.board-name').textContent).toBe('New Name');
    });

    it('pressing Escape cancels modal', async () => {
        await renderBoard();
        const boardName = document.querySelector('.board-name');
        await act(async () => { fireEvent.click(boardName); });
        expect(screen.getByText('Rename Board')).toBeInTheDocument();
        const input = document.querySelector('.modal-input');
        await act(async () => {
            fireEvent.keyDown(input, { key: 'Escape' });
        });
        expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument();
    });

    it('clicking Cancel button closes modal', async () => {
        await renderBoard();
        const boardName = document.querySelector('.board-name');
        await act(async () => { fireEvent.click(boardName); });
        const cancelBtn = screen.getByText('Cancel');
        await act(async () => { fireEvent.click(cancelBtn); });
        expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument();
    });

    it('clicking Confirm button confirms and closes', async () => {
        await renderBoard();
        const boardName = document.querySelector('.board-name');
        await act(async () => { fireEvent.click(boardName); });
        const input = document.querySelector('.modal-input');
        fireEvent.change(input, { target: { value: 'Updated Board' } });
        const confirmBtn = screen.getByText('Confirm');
        await act(async () => { fireEvent.click(confirmBtn); });
        expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument();
        expect(document.querySelector('.board-name').textContent).toBe('Updated Board');
    });
});
