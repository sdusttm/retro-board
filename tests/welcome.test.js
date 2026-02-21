import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
import { RetroBoard } from '../app.js';

const e = React.createElement;

describe('Welcome screen', () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = '#testboard';
    });

    it('renders welcome modal when no username is set', async () => {
        await act(async () => { render(e(RetroBoard)); });
        expect(screen.getByText('Welcome!')).toBeInTheDocument();
    });

    it('shows name input with placeholder', async () => {
        await act(async () => { render(e(RetroBoard)); });
        const input = document.getElementById('user-input');
        expect(input).toBeInTheDocument();
        expect(input.placeholder).toBe('Name');
    });

    it('shows Start button', async () => {
        await act(async () => { render(e(RetroBoard)); });
        expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('clicking Start button sets username and saves to localStorage', async () => {
        await act(async () => { render(e(RetroBoard)); });
        const input = document.getElementById('user-input');
        fireEvent.change(input, { target: { value: 'Alice' } });
        input.value = 'Alice';
        const startBtn = screen.getByText('Start');
        await act(async () => { fireEvent.click(startBtn); });
        expect(localStorage.getItem('retroboard-username')).toBe('Alice');
    });

    it('pressing Enter in input sets username', async () => {
        await act(async () => { render(e(RetroBoard)); });
        const input = document.getElementById('user-input');
        input.value = 'Bob';
        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter' });
        });
        expect(localStorage.getItem('retroboard-username')).toBe('Bob');
    });

    it('empty input does not set username', async () => {
        await act(async () => { render(e(RetroBoard)); });
        const input = document.getElementById('user-input');
        input.value = '';
        const startBtn = screen.getByText('Start');
        await act(async () => { fireEvent.click(startBtn); });
        // Should still show welcome screen
        expect(screen.getByText('Welcome!')).toBeInTheDocument();
    });

    it('after entering name, board renders with 3 columns', async () => {
        await act(async () => { render(e(RetroBoard)); });
        const input = document.getElementById('user-input');
        input.value = 'Alice';
        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter' });
        });
        // Trigger PeerJS open
        const peer = globalThis.Peer.lastInstance;
        if (peer) {
            await act(async () => { peer._emit('open', 'retroboard-testboard'); });
        }
        expect(screen.getByText('WENT WELL')).toBeInTheDocument();
        expect(screen.getByText('TO IMPROVE')).toBeInTheDocument();
        expect(screen.getByText('ACTION ITEMS')).toBeInTheDocument();
    });

    it('restores username from localStorage', async () => {
        localStorage.setItem('retroboard-username', 'SavedUser');
        await act(async () => { render(e(RetroBoard)); });
        // Should NOT show welcome screen
        expect(screen.queryByText('Welcome!')).not.toBeInTheDocument();
    });
});
