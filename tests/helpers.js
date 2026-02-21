import React from 'react';
import { render, act } from '@testing-library/react';

const e = React.createElement;

export async function renderBoard(username = 'TestUser') {
    // Pre-set username to skip welcome screen
    localStorage.setItem('retroboard-username', username);
    window.location.hash = '#testboard';

    // Dynamic import to get fresh module state
    const { RetroBoard } = await import('../app.js');

    let result;
    await act(async () => {
        result = render(e(RetroBoard));
    });

    // Trigger PeerJS 'open' event to initialize as host
    const peerInstance = globalThis.Peer.lastInstance;
    if (peerInstance) {
        await act(async () => {
            peerInstance._emit('open', 'retroboard-testboard');
        });
    }

    return { ...result, peerInstance };
}

export async function renderWelcome() {
    // No username set — shows welcome screen
    window.location.hash = '#testboard';

    const { RetroBoard } = await import('../app.js');

    let result;
    await act(async () => {
        result = render(e(RetroBoard));
    });

    return result;
}
