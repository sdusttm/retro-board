import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import ReactDOM from 'react-dom/client';
import { flushSync } from 'react-dom';
import Sortable from 'sortablejs';

export const generateId = () => Math.random().toString(36).substring(2, 9);
const e = React.createElement;

const THEMES = {
    default: {
        name: 'Neon Pink', accent: '#ff007c', accentSecondary: '#7b2ff7',
        meshGradient: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0,transparent 50%),radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0,transparent 50%),radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0,transparent 50%),radial-gradient(at 0% 50%, hsla(225,39%,30%,1) 0,transparent 50%),radial-gradient(at 50% 50%, hsla(253,16%,7%,1) 0,transparent 50%),radial-gradient(at 100% 50%, hsla(339,49%,30%,1) 0,transparent 50%),radial-gradient(at 0% 100%, hsla(339,49%,30%,1) 0,transparent 50%),radial-gradient(at 50% 100%, hsla(225,39%,30%,1) 0,transparent 50%),radial-gradient(at 100% 100%, hsla(253,16%,7%,1) 0,transparent 50%)',
        glassBg: 'rgba(255,255,255,0.05)', glassBorder: 'rgba(255,255,255,0.1)',
        textPrimary: '#ffffff', textSecondary: 'rgba(255,255,255,0.7)', bgColor: '#0a0a0c'
    },
    ocean: {
        name: 'Ocean Blue', accent: '#00b4d8', accentSecondary: '#0077b6',
        meshGradient: 'radial-gradient(at 0% 0%, hsla(210,30%,7%,1) 0,transparent 50%),radial-gradient(at 50% 0%, hsla(200,50%,22%,1) 0,transparent 50%),radial-gradient(at 100% 0%, hsla(190,60%,25%,1) 0,transparent 50%),radial-gradient(at 0% 50%, hsla(200,50%,20%,1) 0,transparent 50%),radial-gradient(at 50% 50%, hsla(210,30%,7%,1) 0,transparent 50%),radial-gradient(at 100% 50%, hsla(190,60%,22%,1) 0,transparent 50%),radial-gradient(at 0% 100%, hsla(190,60%,22%,1) 0,transparent 50%),radial-gradient(at 50% 100%, hsla(200,50%,20%,1) 0,transparent 50%),radial-gradient(at 100% 100%, hsla(210,30%,7%,1) 0,transparent 50%)',
        glassBg: 'rgba(255,255,255,0.05)', glassBorder: 'rgba(255,255,255,0.1)',
        textPrimary: '#ffffff', textSecondary: 'rgba(255,255,255,0.7)', bgColor: '#0a0c10'
    },
    emerald: {
        name: 'Emerald', accent: '#00c896', accentSecondary: '#059669',
        meshGradient: 'radial-gradient(at 0% 0%, hsla(160,20%,7%,1) 0,transparent 50%),radial-gradient(at 50% 0%, hsla(165,40%,20%,1) 0,transparent 50%),radial-gradient(at 100% 0%, hsla(170,50%,22%,1) 0,transparent 50%),radial-gradient(at 0% 50%, hsla(165,40%,18%,1) 0,transparent 50%),radial-gradient(at 50% 50%, hsla(160,20%,7%,1) 0,transparent 50%),radial-gradient(at 100% 50%, hsla(170,50%,20%,1) 0,transparent 50%),radial-gradient(at 0% 100%, hsla(170,50%,20%,1) 0,transparent 50%),radial-gradient(at 50% 100%, hsla(165,40%,18%,1) 0,transparent 50%),radial-gradient(at 100% 100%, hsla(160,20%,7%,1) 0,transparent 50%)',
        glassBg: 'rgba(255,255,255,0.05)', glassBorder: 'rgba(255,255,255,0.1)',
        textPrimary: '#ffffff', textSecondary: 'rgba(255,255,255,0.7)', bgColor: '#0a0c0a'
    },
    sunset: {
        name: 'Sunset', accent: '#ff6b35', accentSecondary: '#c2185b',
        meshGradient: 'radial-gradient(at 0% 0%, hsla(0,20%,7%,1) 0,transparent 50%),radial-gradient(at 50% 0%, hsla(15,50%,22%,1) 0,transparent 50%),radial-gradient(at 100% 0%, hsla(340,45%,25%,1) 0,transparent 50%),radial-gradient(at 0% 50%, hsla(15,50%,20%,1) 0,transparent 50%),radial-gradient(at 50% 50%, hsla(0,20%,7%,1) 0,transparent 50%),radial-gradient(at 100% 50%, hsla(340,45%,22%,1) 0,transparent 50%),radial-gradient(at 0% 100%, hsla(340,45%,22%,1) 0,transparent 50%),radial-gradient(at 50% 100%, hsla(15,50%,20%,1) 0,transparent 50%),radial-gradient(at 100% 100%, hsla(0,20%,7%,1) 0,transparent 50%)',
        glassBg: 'rgba(255,255,255,0.05)', glassBorder: 'rgba(255,255,255,0.1)',
        textPrimary: '#ffffff', textSecondary: 'rgba(255,255,255,0.7)', bgColor: '#0c0a0a'
    },
    lavender: {
        name: 'Lavender', accent: '#a855f7', accentSecondary: '#6366f1',
        meshGradient: 'radial-gradient(at 0% 0%, hsla(270,20%,7%,1) 0,transparent 50%),radial-gradient(at 50% 0%, hsla(260,45%,25%,1) 0,transparent 50%),radial-gradient(at 100% 0%, hsla(280,50%,28%,1) 0,transparent 50%),radial-gradient(at 0% 50%, hsla(260,45%,22%,1) 0,transparent 50%),radial-gradient(at 50% 50%, hsla(270,20%,7%,1) 0,transparent 50%),radial-gradient(at 100% 50%, hsla(280,50%,25%,1) 0,transparent 50%),radial-gradient(at 0% 100%, hsla(280,50%,25%,1) 0,transparent 50%),radial-gradient(at 50% 100%, hsla(260,45%,22%,1) 0,transparent 50%),radial-gradient(at 100% 100%, hsla(270,20%,7%,1) 0,transparent 50%)',
        glassBg: 'rgba(255,255,255,0.05)', glassBorder: 'rgba(255,255,255,0.1)',
        textPrimary: '#ffffff', textSecondary: 'rgba(255,255,255,0.7)', bgColor: '#0c0a10'
    },
    gold: {
        name: 'Gold', accent: '#f59e0b', accentSecondary: '#b45309',
        meshGradient: 'radial-gradient(at 0% 0%, hsla(30,20%,7%,1) 0,transparent 50%),radial-gradient(at 50% 0%, hsla(35,45%,20%,1) 0,transparent 50%),radial-gradient(at 100% 0%, hsla(25,50%,22%,1) 0,transparent 50%),radial-gradient(at 0% 50%, hsla(35,45%,18%,1) 0,transparent 50%),radial-gradient(at 50% 50%, hsla(30,20%,7%,1) 0,transparent 50%),radial-gradient(at 100% 50%, hsla(25,50%,20%,1) 0,transparent 50%),radial-gradient(at 0% 100%, hsla(25,50%,20%,1) 0,transparent 50%),radial-gradient(at 50% 100%, hsla(35,45%,18%,1) 0,transparent 50%),radial-gradient(at 100% 100%, hsla(30,20%,7%,1) 0,transparent 50%)',
        glassBg: 'rgba(255,255,255,0.05)', glassBorder: 'rgba(255,255,255,0.1)',
        textPrimary: '#ffffff', textSecondary: 'rgba(255,255,255,0.7)', bgColor: '#0c0b0a'
    }
};

function applyTheme(key) {
    const theme = THEMES[key];
    if (!theme) return;
    const s = document.documentElement.style;
    s.setProperty('--accent-color', theme.accent);
    s.setProperty('--accent-secondary', theme.accentSecondary);
    s.setProperty('--mesh-gradient', theme.meshGradient);
    s.setProperty('--glass-bg', theme.glassBg);
    s.setProperty('--glass-border', theme.glassBorder);
    s.setProperty('--text-primary', theme.textPrimary);
    s.setProperty('--text-secondary', theme.textSecondary);
    document.body.style.backgroundColor = theme.bgColor;
    localStorage.setItem('retroboard-theme', key);
}

// Apply saved theme immediately to avoid flash
applyTheme(localStorage.getItem('retroboard-theme') || 'default');

function nameColor(name) {
    if (!name) return 'hsl(0,70%,50%)';
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return `hsl(${h},70%,50%)`;
}

function avatarGradient(name) {
    if (!name) return undefined;
    const h1 = nameColor(name);
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    const h2 = `hsl(${(h + 40) % 360},60%,45%)`;
    return { background: `linear-gradient(135deg, ${h1}, ${h2})` };
}

export function applyAction(state, action) {
    const next = { ...state };
    const { type, columnId, cardId } = action;
    switch (type) {
        case 'CREATE':
            next[columnId] = [...next[columnId], { id: cardId, text: '', votes: 0, author: action.author, timestamp: Date.now() }];
            break;
        case 'UPDATE':
            next[columnId] = next[columnId].map(c => c.id === cardId ? { ...c, text: action.text } : c);
            break;
        case 'VOTE':
            next[columnId] = next[columnId].map(c => c.id === cardId ? { ...c, votes: c.votes + 1 } : c);
            break;
        case 'DELETE':
            next[columnId] = next[columnId].filter(c => c.id !== cardId);
            break;
        case 'MOVE': {
            const sId = action.sourceColumnId;
            const dId = action.destColumnId;
            const sourceItems = [...next[sId]];
            const destItems = sId === dId ? sourceItems : [...next[dId]];
            const [moved] = sourceItems.splice(action.sourceIndex, 1);
            destItems.splice(action.destIndex, 0, moved);
            next[sId] = sourceItems;
            next[dId] = destItems;
            break;
        }
    }
    return next;
}

export function RetroBoard() {
    const [boardId] = useState(() => window.location.hash.substring(1) || generateId());
    const [boardName, setBoardName] = useState('Untitled Board');
    const [userName, setUserName] = useState(() => localStorage.getItem('retroboard-username') || '');
    const [isHost, setIsHost] = useState(false);
    const [state, setState] = useState({
        'went-well': [],
        'to-improve': [],
        'action-items': []
    });
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [toast, setToast] = useState({ visible: false, message: '' });
    const [isBoardsOpen, setIsBoardsOpen] = useState(false);
    const [boards, setBoards] = useState([]);
    const [modal, setModal] = useState({ visible: false, title: '', placeholder: '', defaultValue: '', onConfirm: null });
    const [status, setStatus] = useState('');
    const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('retroboard-theme') || 'default');
    const [themeOpen, setThemeOpen] = useState(false);
    const themeRef = useRef(null);

    const stateRef = useRef(state);
    const boardNameRef = useRef(boardName);
    const onlineUsersRef = useRef(onlineUsers);
    const userNameRef = useRef(userName);
    const connectionsRef = useRef([]);
    const peerRef = useRef(null);
    const hostConnRef = useRef(null);
    const columnsRef = useRef({});
    const newCardIds = useRef(new Set());
    const stateTsRef = useRef(0);

    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { boardNameRef.current = boardName; }, [boardName]);
    useEffect(() => { onlineUsersRef.current = onlineUsers; }, [onlineUsers]);
    const [peerReady, setPeerReady] = useState(() => !!userName);
    useEffect(() => { userNameRef.current = userName; }, [userName]);

    const broadcastState = useCallback(() => {
        if (!isHost) return;
        const payload = {
            type: 'SYNC_STATE',
            state: stateRef.current,
            boardName: boardNameRef.current,
            onlineUsers: onlineUsersRef.current,
            stateTs: stateTsRef.current
        };
        connectionsRef.current.forEach(conn => {
            if (conn.open) conn.send(payload);
        });
        localStorage.setItem(`retroboard-state-${boardId}`, JSON.stringify(stateRef.current));
        localStorage.setItem(`retroboard-name-${boardId}`, boardNameRef.current);
        localStorage.setItem(`retroboard-ts-${boardId}`, String(stateTsRef.current));
    }, [isHost, boardId]);

    useEffect(() => {
        if (!userName) return;
        if (!peerReady) {
            setPeerReady(true);
            return;
        }
        // Rename: update online users list and broadcast
        const next = onlineUsersRef.current.map(u => u.isHost ? { ...u, name: userName } : u);
        setOnlineUsers(next);
        onlineUsersRef.current = next;
        setTimeout(broadcastState, 0);
    }, [userName, broadcastState, peerReady]);

    const handleAction = useCallback((action, fromRemote = false) => {
        if (action.type === 'CREATE') newCardIds.current.add(action.cardId);
        stateTsRef.current = Date.now();
        setState(prev => applyAction(prev, action));

        if (isHost) {
            setTimeout(broadcastState, 0);
        } else if (!fromRemote && hostConnRef.current?.open) {
            hostConnRef.current.send({ type: 'ACTION', action });
        }
    }, [isHost, broadcastState]);

    useEffect(() => {
        if (!userNameRef.current) return;
        window.location.hash = boardId;

        const p = new Peer(`retroboard-${boardId}`, { debug: 1 });
        peerRef.current = p;

        p.on('open', (id) => {
            if (id === `retroboard-${boardId}`) {
                setIsHost(true); setStatus('Host (Ready)');
                const saved = localStorage.getItem(`retroboard-state-${boardId}`);
                if (saved) try { setState(JSON.parse(saved)); } catch (e) { }
                const savedName = localStorage.getItem(`retroboard-name-${boardId}`);
                if (savedName) setBoardName(savedName);
                stateTsRef.current = parseInt(localStorage.getItem(`retroboard-ts-${boardId}`) || '0', 10);
                const initialUsers = [{ name: userNameRef.current, isHost: true }];
                setOnlineUsers(initialUsers);
                onlineUsersRef.current = initialUsers;
            }
        });

        p.on('connection', (conn) => {
            connectionsRef.current.push(conn);
            conn.on('open', () => {
                conn.send({ type: 'SYNC_STATE', state: stateRef.current, boardName: boardNameRef.current, onlineUsers: onlineUsersRef.current, stateTs: stateTsRef.current });
            });
            conn.on('data', (data) => {
                if (data.type === 'ANNOUNCE') {
                    conn._userName = data.userName;
                    // If guest has newer state, adopt it
                    if (data.savedTs && data.savedTs > stateTsRef.current && data.savedState) {
                        setState(data.savedState);
                        stateRef.current = data.savedState;
                        stateTsRef.current = data.savedTs;
                        if (data.savedBoardName) { setBoardName(data.savedBoardName); boardNameRef.current = data.savedBoardName; }
                    }
                    const next = [{ name: userNameRef.current, isHost: true }, ...connectionsRef.current.map(c => ({ name: c._userName || 'Guest', isHost: false }))];
                    setOnlineUsers(next);
                    onlineUsersRef.current = next;
                    const payload = { type: 'SYNC_STATE', state: stateRef.current, boardName: boardNameRef.current, onlineUsers: next, stateTs: stateTsRef.current };
                    connectionsRef.current.forEach(c => { if (c.open) c.send(payload); });
                } else if (data.type === 'ACTION') {
                    handleAction(data.action, true);
                }
            });
            conn.on('close', () => {
                connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
                const next = [{ name: userNameRef.current, isHost: true }, ...connectionsRef.current.map(c => ({ name: c._userName || 'Guest', isHost: false }))];
                setOnlineUsers(next);
                onlineUsersRef.current = next;
                const payload = { type: 'SYNC_STATE', state: stateRef.current, boardName: boardNameRef.current, onlineUsers: next, stateTs: stateTsRef.current };
                connectionsRef.current.forEach(c => { if (c.open) c.send(payload); });
            });
        });

        p.on('error', (err) => {
            if (err.type === 'unavailable-id') {
                const gp = new Peer(null, { debug: 1 });
                peerRef.current = gp;
                gp.on('open', () => {
                    setIsHost(false); setStatus('Guest (Connecting...)');
                    const c = gp.connect(`retroboard-${boardId}`, { reliable: true }); hostConnRef.current = c;
                    c.on('open', () => {
                        setStatus('Guest (Connected)');
                        // Send saved state + timestamp so host can adopt if newer
                        const announce = { type: 'ANNOUNCE', userName: userNameRef.current };
                        const savedTs = parseInt(localStorage.getItem(`retroboard-ts-${boardId}`) || '0', 10);
                        if (savedTs) {
                            announce.savedTs = savedTs;
                            try { announce.savedState = JSON.parse(localStorage.getItem(`retroboard-state-${boardId}`)); } catch (e) { }
                            announce.savedBoardName = localStorage.getItem(`retroboard-name-${boardId}`) || undefined;
                        }
                        c.send(announce);
                    });
                    c.on('data', (d) => {
                        if (d.type === 'SYNC_STATE') {
                            setState(d.state); setBoardName(d.boardName); setOnlineUsers(d.onlineUsers);
                            stateTsRef.current = d.stateTs || Date.now();
                            localStorage.setItem(`retroboard-state-${boardId}`, JSON.stringify(d.state));
                            localStorage.setItem(`retroboard-name-${boardId}`, d.boardName);
                            localStorage.setItem(`retroboard-ts-${boardId}`, String(d.stateTs || Date.now()));
                        }
                    });
                });
            }
        });

        return () => p.destroy();
    }, [boardId, peerReady]);

    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => setToast({ visible: false, message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.visible]);

    useEffect(() => {
        if (!themeOpen) return;
        const handleClick = (ev) => {
            if (themeRef.current && !themeRef.current.contains(ev.target)) setThemeOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [themeOpen]);

    const refreshBoards = useCallback(() => {
        const found = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('retroboard-state-')) {
                const id = key.replace('retroboard-state-', '');
                const name = localStorage.getItem(`retroboard-name-${id}`) || 'Untitled Board';
                let cardCount = 0;
                try {
                    const savedState = JSON.parse(localStorage.getItem(key));
                    cardCount = Object.values(savedState).reduce((sum, col) => sum + col.length, 0);
                } catch (e) { }
                found.push({ id, name, cardCount });
            }
        }
        setBoards(found);
    }, []);

    const openModal = useCallback((title, placeholder, defaultValue, onConfirm) => {
        setModal({ visible: true, title, placeholder, defaultValue, onConfirm });
    }, []);


    useEffect(() => {
        if (!userName) return;
        const sortables = [];
        Object.keys(columnsRef.current).forEach(colId => {
            const el = columnsRef.current[colId];
            if (el) {
                const s = new Sortable(el, {
                    group: 'cards',
                    animation: 250,
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag',
                    filter: '.vote-btn, .delete-btn, .card-text',
                    preventOnFilter: false,
                    onStart: () => document.body.classList.add('is-dragging'),
                    onEnd: (evt) => {
                        document.body.classList.remove('is-dragging');
                        const sourceColumnId = evt.from.dataset.colid;
                        const destColumnId = evt.to.dataset.colid;
                        const sourceIndex = evt.oldIndex;
                        const destIndex = evt.newIndex;
                        const cardId = evt.item.dataset.id;

                        if (sourceColumnId === destColumnId && sourceIndex === destIndex) return;

                        // Undo SortableJS's DOM move and synchronously re-render React
                        // in the same JS frame so the browser never paints intermediate state.
                        if (evt.from.children[evt.oldIndex]) {
                            evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex]);
                        } else {
                            evt.from.appendChild(evt.item);
                        }
                        flushSync(() => {
                            handleAction({
                                type: 'MOVE',
                                cardId,
                                sourceColumnId,
                                destColumnId,
                                sourceIndex,
                                destIndex
                            });
                        });
                    }
                });
                sortables.push(s);
            }
        });
        return () => sortables.forEach(s => s.destroy());
    }, [userName, handleAction]);

    if (!userName) {
        return e('div', { className: 'modal-overlay active' },
            e('div', { className: 'modal' },
                e('h3', { className: 'modal-title' }, 'Welcome!'),
                e('p', { style: { color: 'var(--text-secondary)', marginBottom: '2rem' } }, 'Enter your name to join'),
                e('input', {
                    id: 'user-input', className: 'modal-input', placeholder: 'Name', autoFocus: true,
                    onKeyDown: ev => { if (ev.key === 'Enter') { setUserName(ev.target.value); localStorage.setItem('retroboard-username', ev.target.value); } }
                }),
                e('div', { className: 'modal-actions' },
                    e('button', { className: 'action-btn', onClick: () => { const v = document.getElementById('user-input').value; if (v) { setUserName(v); localStorage.setItem('retroboard-username', v); } } }, 'Start')
                )
            )
        );
    }

    return e(React.Fragment, null,
        e('header', null,
            e('div', { className: 'logo' }, 'RETRO', e('span', null, 'BOARD')),
            e('div', { className: 'board-info' },
                e('span', { className: `status-dot ${isHost || status.includes('Connected') ? 'connected' : ''}`, title: status }),
                e('div', { className: 'board-name-group' },
                    e('span', {
                        className: 'board-name', onClick: () => {
                            openModal('Rename Board', 'Enter new name...', boardName, (n) => {
                                if (n) {
                                    setBoardName(n);
                                    stateTsRef.current = Date.now();
                                    setTimeout(broadcastState, 0);
                                }
                            });
                        }
                    }, boardName),
                    e('span', { className: 'board-id-sub' }, `#${boardId}`)
                )
            ),
            e('div', { className: 'header-actions' },
                e('button', {
                    className: `action-btn secondary ${isBoardsOpen ? 'active' : ''}`,
                    onClick: () => { refreshBoards(); setIsBoardsOpen(true); }
                },
                    e('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, style: { marginRight: '6px' } },
                        e('path', { d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
                    ),
                    'Boards'
                ),
                e('button', {
                    className: 'action-btn secondary',
                    onClick: () => {
                        openModal('New Board', 'Enter board name...', 'Untitled Board', (name) => {
                            if (name) {
                                const id = generateId();
                                localStorage.setItem(`retroboard-name-${id}`, name);
                                window.location.hash = id;
                                window.location.reload();
                            }
                        });
                    }
                }, 'New Board'),
                e('button', { className: 'action-btn', onClick: () => { navigator.clipboard.writeText(window.location.href); setToast({ visible: true, message: 'Link copied to clipboard!' }); } }, 'Share Board'),
                e('div', { className: 'theme-picker-wrapper', ref: themeRef },
                    e('button', {
                        className: 'theme-picker-btn', title: 'Change theme',
                        onClick: () => setThemeOpen(o => !o)
                    },
                        e('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
                            e('circle', { cx: 13.5, cy: 6.5, r: '.5', fill: 'currentColor' }),
                            e('circle', { cx: 17.5, cy: 10.5, r: '.5', fill: 'currentColor' }),
                            e('circle', { cx: 8.5, cy: 7.5, r: '.5', fill: 'currentColor' }),
                            e('circle', { cx: 6.5, cy: 12, r: '.5', fill: 'currentColor' }),
                            e('path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z' })
                        )
                    ),
                    themeOpen && e('div', { className: 'theme-dropdown' },
                        Object.entries(THEMES).map(([key, theme]) =>
                            e('button', {
                                key, className: `theme-option ${currentTheme === key ? 'active' : ''}`,
                                onClick: () => { applyTheme(key); setCurrentTheme(key); setThemeOpen(false); }
                            },
                                e('span', { className: 'theme-swatch', style: { backgroundColor: theme.accent } }),
                                e('span', { className: 'theme-label' }, theme.name),
                                e('svg', { className: 'theme-check', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 3 },
                                    e('path', { d: 'M20 6L9 17l-5-5' })
                                )
                            )
                        )
                    )
                ),
                e('div', {
                    className: 'user-badge', style: { cursor: 'pointer' },
                    onClick: () => {
                        openModal('Rename User', 'Enter new name...', userName, (n) => {
                            if (n) {
                                setUserName(n);
                                localStorage.setItem('retroboard-username', n);
                            }
                        });
                    }
                },
                    e('span', { className: 'user-avatar', style: avatarGradient(userName) }, userName[0]?.toUpperCase()),
                    e('span', { className: 'user-name-display' }, userName)
                )
            )
        ),
        e('div', { className: 'users-panel' },
            e('div', { className: 'users-panel-header' },
                e('span', { className: 'users-panel-dot' }), e('span', null, `${onlineUsers.length} online`)
            ),
            e('div', { className: 'users-list' },
                onlineUsers.map((u, i) => e('div', { className: 'user-presence-item', key: i },
                    e('span', { className: 'user-presence-avatar', style: avatarGradient(u.name) }, u.name ? u.name[0].toUpperCase() : '?'),
                    e('span', { className: 'user-presence-name' }, `${u.name} ${u.isHost ? '(host)' : ''}`)
                ))
            )
        ),
        e('main', { className: 'board-container' },
            e('div', { className: 'board-columns' },
                ['went-well', 'to-improve', 'action-items'].map(colId => (
                    e('section', { className: 'column', key: colId },
                        e('div', { className: 'column-header' },
                            e('h2', { className: 'column-title' }, colId.replace('-', ' ').toUpperCase()),
                            e('button', { className: 'add-btn', onClick: () => {
                                const id = generateId();
                                handleAction({ type: 'CREATE', columnId: colId, cardId: id, author: userName });
                                setTimeout(() => {
                                    const list = columnsRef.current[colId];
                                    if (list) {
                                        list.scrollTop = list.scrollHeight;
                                        const newCard = list.querySelector(`[data-id="${id}"] .card-text`);
                                        if (newCard) newCard.focus();
                                    }
                                }, 0);
                            } }, '+')
                        ),
                        e('div', {
                            className: 'card-list',
                            ref: el => columnsRef.current[colId] = el,
                            'data-colid': colId
                        },
                            state[colId].map((card, idx) => (
                                e('div', {
                                    key: card.id,
                                    'data-id': card.id,
                                    className: `card${newCardIds.current.has(card.id) ? ' card-entering' : ''}`,
                                    onAnimationEnd: () => newCardIds.current.delete(card.id),
                                    onDoubleClick: (ev) => {
                                        const textEl = ev.currentTarget.querySelector('.card-text');
                                        if (textEl) { textEl.focus(); }
                                    }
                                },
                                    e('button', { className: 'delete-btn', onClick: () => handleAction({ type: 'DELETE', columnId: colId, cardId: card.id }) },
                                        e('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
                                            e('path', { d: 'M18 6L6 18M6 6l12 12' })
                                        )
                                    ),
                                    e('div', {
                                        className: 'card-text', contentEditable: true, suppressContentEditableWarning: true,
                                        onBlur: ev => handleAction({ type: 'UPDATE', columnId: colId, cardId: card.id, text: ev.target.innerText }),
                                        onKeyDown: ev => { if (ev.key === 'Enter') { ev.preventDefault(); ev.target.blur(); } },
                                        'data-placeholder': 'Type something...'
                                    }, card.text),
                                    e('div', { className: 'card-footer' },
                                        e('div', { className: 'card-author' },
                                            e('span', { className: 'card-author-avatar', style: avatarGradient(card.author) }, card.author ? card.author[0].toUpperCase() : '?'),
                                            e('span', { className: 'card-author-name' }, card.author || 'Anonymous')
                                        ),
                                        e('div', { className: 'card-actions-group' },
                                            e('button', { className: 'vote-btn', onMouseDown: ev => ev.stopPropagation(), onClick: () => handleAction({ type: 'VOTE', columnId: colId, cardId: card.id }) },
                                                e('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
                                                    e('path', { d: 'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3' })
                                                ),
                                                e('span', null, card.votes)
                                            ),
                                        )
                                    )
                                )
                            ))
                        )
                    )
                ))
            ),
            toast.visible && e('div', { className: `toast ${toast.visible ? 'show' : ''}` },
                e('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, style: { marginRight: '8px' } },
                    e('path', { d: 'M20 6L9 17l-5-5' })
                ),
                toast.message
            ),

            e(React.Fragment, null,
                e('div', { className: `boards-panel-overlay ${isBoardsOpen ? 'active' : ''}`, onClick: () => setIsBoardsOpen(false) }),
                e('div', { className: `boards-panel ${isBoardsOpen ? 'open' : ''}` },
                    e('div', { className: 'boards-panel-header' },
                        e('h3', null, 'Your Boards'),
                        e('button', { className: 'close-btn', onClick: () => setIsBoardsOpen(false) }, '×')
                    ),
                    e('div', { className: 'boards-list' },
                        boards.length === 0 ? e('div', { className: 'no-boards' }, 'No recent boards') :
                            boards.map(b => e('div', {
                                key: b.id,
                                className: `board-item ${b.id === boardId ? 'active' : ''}`,
                                onClick: () => { if (b.id !== boardId) { window.location.hash = b.id; window.location.reload(); } }
                            },
                                e('span', { className: 'board-item-dot' }),
                                e('div', { className: 'board-item-info' },
                                    e('div', { className: 'board-item-name' }, b.name),
                                    e('div', { className: 'board-item-id' }, `#${b.id}`)
                                ),
                                e('span', { className: 'board-item-cards' }, `${b.cardCount} card${b.cardCount !== 1 ? 's' : ''}`),
                                b.id !== boardId && e('button', {
                                    className: 'board-item-delete',
                                    title: 'Remove board',
                                    onClick: (ev) => {
                                        ev.stopPropagation();
                                        localStorage.removeItem(`retroboard-state-${b.id}`);
                                        localStorage.removeItem(`retroboard-name-${b.id}`);
                                        localStorage.removeItem(`retroboard-ts-${b.id}`);
                                        refreshBoards();
                                    }
                                },
                                    e('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
                                        e('path', { d: 'M18 6L6 18M6 6l12 12' })
                                    )
                                )
                            ))
                    )
                )
            ),

            modal.visible && e('div', { className: 'modal-overlay active', onClick: (ev) => { if (ev.target.className.includes('modal-overlay')) setModal({ ...modal, visible: false }); } },
                e('div', { className: 'modal' },
                    e('h3', { className: 'modal-title' }, modal.title),
                    e('input', {
                        id: 'modal-input', className: 'modal-input', placeholder: modal.placeholder, defaultValue: modal.defaultValue, autoFocus: true,
                        onKeyDown: ev => {
                            if (ev.key === 'Enter') {
                                modal.onConfirm(ev.target.value);
                                setModal({ ...modal, visible: false });
                            }
                            if (ev.key === 'Escape') setModal({ ...modal, visible: false });
                        }
                    }),
                    e('div', { className: 'modal-actions' },
                        e('button', { className: 'action-btn secondary', onClick: () => setModal({ ...modal, visible: false }) }, 'Cancel'),
                        e('button', {
                            className: 'action-btn',
                            onClick: () => {
                                const v = document.getElementById('modal-input').value;
                                modal.onConfirm(v);
                                setModal({ ...modal, visible: false });
                            }
                        }, 'Confirm')
                    )
                )
            )
        )
    );
}

const run = () => {
    const el = document.getElementById('root');
    if (el) ReactDOM.createRoot(el).render(e(RetroBoard));
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
else run();
