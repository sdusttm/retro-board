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

describe('Online users', () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = '';
    });

    it('host user appears in online users list', async () => {
        await renderBoard('Alice');
        const usersPanel = document.querySelector('.users-panel');
        expect(usersPanel).toBeInTheDocument();
        const userName = usersPanel.querySelector('.user-presence-name');
        expect(userName.textContent).toContain('Alice');
    });

    it('host user is marked with (host)', async () => {
        await renderBoard('Alice');
        expect(screen.getByText('Alice (host)')).toBeInTheDocument();
    });

    it('shows correct online count', async () => {
        await renderBoard('Alice');
        expect(screen.getByText('1 online')).toBeInTheDocument();
    });

    it('user avatar shows first letter uppercased', async () => {
        await renderBoard('alice');
        const avatar = document.querySelector('.user-presence-avatar');
        expect(avatar.textContent).toBe('A');
    });

    it('user rename updates display name without duplicates', async () => {
        await renderBoard('Alice');
        // Click user badge to open rename modal
        const badge = document.querySelector('.user-badge');
        await act(async () => { fireEvent.click(badge); });

        // Type new name and confirm
        const input = document.querySelector('.modal-input');
        fireEvent.change(input, { target: { value: 'Bob' } });
        const confirmBtn = screen.getByText('Confirm');
        await act(async () => { fireEvent.click(confirmBtn); });

        // Should show Bob, not Alice, and no duplicates
        const userItems = document.querySelectorAll('.user-presence-item');
        expect(userItems).toHaveLength(1);
        expect(screen.getByText('Bob (host)')).toBeInTheDocument();
        expect(screen.queryByText('Alice (host)')).not.toBeInTheDocument();
    });
});
