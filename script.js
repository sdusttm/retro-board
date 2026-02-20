/**
 * Retro Board - Real-time Collaboration logic using PeerJS (WebRTC)
 * Reliable cross-browser file:/// sync via Host/Guest model.
 */

const app = {
    peer: null,
    connections: [],     // As host, all guest connections
    hostConnection: null,// As guest, connection to host
    isHost: false,
    boardId: null,
    boardName: 'Untitled Board',
    userName: null,
    onlineUsers: [],     // { name, isHost }

    // The single source of truth (managed by Host)
    state: {
        'went-well': [],
        'to-improve': [],
        'action-items': []
    },

    init() {
        this.boardId = window.location.hash.substring(1) || this.generateId();
        window.location.hash = this.boardId;

        // Load board name from localStorage if available
        const savedName = localStorage.getItem(`retroboard-name-${this.boardId}`);
        if (savedName) this.boardName = savedName;

        // Load user name from localStorage
        this.userName = localStorage.getItem('retroboard-username');

        document.getElementById('board-id-text').innerText = `#${this.boardId}`;
        this.updateBoardNameUI();
        this.updateStatusUI('Connecting...');

        if (!this.userName) {
            // First-time user — ask for their name before connecting
            this.showModal('Welcome!', 'Enter your name to get started...', '').then(name => {
                this.userName = (name && name.trim()) || 'Anonymous';
                localStorage.setItem('retroboard-username', this.userName);
                this.updateUserNameUI();
                this.initializePeer(`retroboard-${this.boardId}`);
            });
        } else {
            this.updateUserNameUI();
            this.initializePeer(`retroboard-${this.boardId}`);
        }
    },

    initializePeer(requestedId) {
        // Initialize PeerJS with the requested ID or auto-assigned if null
        this.peer = new Peer(requestedId, {
            // Using PeerJS default cloud server
            debug: 2
        });

        this.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);

            if (id === `retroboard-${this.boardId}`) {
                // I got the board ID. I am the HOST.
                console.log('I am the HOST.');
                this.isHost = true;
                this.loadLocalState();
                this.onlineUsers = [{ name: this.userName || 'Anonymous', isHost: true }];
                this.renderOnlineUsers();
                this.updateStatusUI('Host (Ready)');
                this.setupHostListeners();
            } else {
                // I got a random ID. I am a GUEST.
                console.log('I am a GUEST.');
                this.isHost = false;
                this.updateStatusUI('Guest (Connecting...)');
                this.connectToHost();
            }
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err.type);
            if (err.type === 'unavailable-id') {
                console.log('Board ID is taken. Becoming a Guest...');
                // The ID is already taken by the Host. Close this peer and retry without a specific ID to become a guest.
                this.peer.destroy();
                setTimeout(() => {
                    this.initializePeer(null);
                }, 500);
            } else if (err.type === 'server-error' || err.type === 'network') {
                this.updateStatusUI('Offline (Network Error)', false);
                // Fallback to local mode if network fails entirely
                if (requestedId === `retroboard-${this.boardId}`) {
                    this.isHost = true;
                    this.loadLocalState();
                }
            }
        });
    },

    // --- HOST LOGIC --- //

    loadLocalState() {
        const saved = localStorage.getItem(`retroboard-state-${this.boardId}`);
        if (saved) {
            try {
                this.state = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved state', e);
            }
        }
        const savedName = localStorage.getItem(`retroboard-name-${this.boardId}`);
        if (savedName) this.boardName = savedName;
        this.updateBoardNameUI();
        this.render();
    },

    saveLocalState() {
        localStorage.setItem(`retroboard-state-${this.boardId}`, JSON.stringify(this.state));
        localStorage.setItem(`retroboard-name-${this.boardId}`, this.boardName);
    },

    setupHostListeners() {
        // Host listens for new guests
        this.peer.on('connection', (conn) => {
            console.log('Guest connected:', conn.peer);
            this.connections.push(conn);
            this.updateStatusUI(`Host (${this.connections.length} Guests)`);

            // Send current state to the new guest immediately
            conn.on('open', () => {
                conn.send({ type: 'SYNC_STATE', state: this.state, boardName: this.boardName, onlineUsers: this.onlineUsers });
            });

            // Listen for actions from guests
            conn.on('data', (data) => {
                console.log('Host received update from guest:', data);
                if (data.type === 'ANNOUNCE') {
                    // Guest is telling us their name
                    conn._userName = data.userName;
                    this.rebuildOnlineUsers();
                    this.broadcastState();
                } else if (data.type === 'ACTION') {
                    if (data.action.type === 'RENAME') {
                        this.boardName = data.action.boardName;
                        this.updateBoardNameUI();
                    } else {
                        this.processAction(data.action, false);
                    }
                    this.broadcastState();
                }
            });

            conn.on('close', () => {
                this.connections = this.connections.filter(c => c !== conn);
                this.updateStatusUI(`Host (${this.connections.length} Guests)`);
                this.rebuildOnlineUsers();
                this.broadcastState();
            });
        });
    },

    rebuildOnlineUsers() {
        this.onlineUsers = [{ name: this.userName || 'Anonymous', isHost: true }];
        this.connections.forEach(conn => {
            if (conn.open) {
                this.onlineUsers.push({ name: conn._userName || 'Guest', isHost: false });
            }
        });
        this.renderOnlineUsers();
    },

    broadcastState() {
        if (!this.isHost) return;
        this.saveLocalState();
        this.render();
        const payload = { type: 'SYNC_STATE', state: this.state, boardName: this.boardName, onlineUsers: this.onlineUsers };
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(payload);
            }
        });
    },

    // --- GUEST LOGIC --- //

    connectToHost() {
        // Guest connects specifically to the board ID
        this.hostConnection = this.peer.connect(`retroboard-${this.boardId}`, {
            reliable: true
        });

        this.hostConnection.on('open', () => {
            console.log('Connected to Host.');
            this.updateStatusUI('Guest (Connected)');
            // Announce our name to the host
            this.hostConnection.send({ type: 'ANNOUNCE', userName: this.userName || 'Anonymous' });
        });

        this.hostConnection.on('data', (data) => {
            if (data.type === 'SYNC_STATE') {
                console.log('Received state from Host');
                this.state = data.state;
                if (data.boardName) {
                    this.boardName = data.boardName;
                    this.updateBoardNameUI();
                }
                if (data.onlineUsers) {
                    this.onlineUsers = data.onlineUsers;
                    this.renderOnlineUsers();
                }
                this.render();
            }
        });

        this.hostConnection.on('close', () => {
            console.log('Host disconnected.');
            this.updateStatusUI('Guest (Host Offline)', false);
            // Optional: Try to reconnect or become host if old host dies? 
            // Keep simple for now.
        });

        this.hostConnection.on('error', (err) => {
            console.error('Connection error:', err);
            this.updateStatusUI('Connection Error', false);
        });
    },

    sendActionToHost(action) {
        if (this.hostConnection && this.hostConnection.open) {
            this.hostConnection.send({ type: 'ACTION', action: action });
            // Optimistic rendering could go here, but waiting for host sync prevents conflicts.
        } else {
            console.warn('Cannot send action. Host not connected.');
            alert('Cannot save changes. The host of this board is currently offline.');
        }
    },

    // --- SHARED ACTIONS --- //

    dispatchAction(action) {
        if (this.isHost) {
            this.processAction(action, true); // true = broadcast
        } else {
            this.sendActionToHost(action);
        }
    },

    processAction(action, shouldBroadcast = false) {
        const colId = action.columnId;
        const cardId = action.cardId;

        switch (action.type) {
            case 'CREATE':
                this.state[colId].push({
                    id: cardId,
                    text: '',
                    votes: 0,
                    author: action.author || 'Anonymous',
                    timestamp: action.timestamp
                });
                break;
            case 'UPDATE':
                const cardToUpdate = this.state[colId].find(c => c.id === cardId);
                if (cardToUpdate) cardToUpdate.text = action.text;
                break;
            case 'DELETE':
                this.state[colId] = this.state[colId].filter(c => c.id !== cardId);
                break;
            case 'VOTE':
                const cardToVote = this.state[colId].find(c => c.id === cardId);
                if (cardToVote) cardToVote.votes++;
                break;
            case 'MOVE':
                const fromCol = action.fromColumnId;
                const toCol = action.columnId;
                const cardIndex = this.state[fromCol].findIndex(c => c.id === cardId);
                if (cardIndex !== -1) {
                    const [movedCard] = this.state[fromCol].splice(cardIndex, 1);
                    this.state[toCol].push(movedCard);
                }
                break;
        }

        if (this.isHost && shouldBroadcast) {
            this.broadcastState();
        }
    },

    // --- UI INTERACTION --- //

    createCard(columnId) {
        const cardId = this.generateId();
        this.dispatchAction({
            type: 'CREATE',
            columnId: columnId,
            cardId: cardId,
            author: this.userName || 'Anonymous',
            timestamp: Date.now()
        });

        // Wait for render (local or network roundtrip) then focus
        setTimeout(() => {
            const cardElement = document.querySelector(`[data-id="${cardId}"] .card-text`);
            if (cardElement) cardElement.focus();
        }, 300);
    },

    updateCard(columnId, cardId, text) {
        this.dispatchAction({
            type: 'UPDATE',
            columnId: columnId,
            cardId: cardId,
            text: text
        });
    },

    deleteCard(columnId, cardId) {
        this.dispatchAction({
            type: 'DELETE',
            columnId: columnId,
            cardId: cardId
        });
    },

    vote(columnId, cardId) {
        this.dispatchAction({
            type: 'VOTE',
            columnId: columnId,
            cardId: cardId
        });
    },

    moveCard(fromColumnId, toColumnId, cardId) {
        if (fromColumnId === toColumnId) return;
        this.dispatchAction({
            type: 'MOVE',
            fromColumnId: fromColumnId,
            columnId: toColumnId,
            cardId: cardId
        });
    },

    // --- UTILS & RENDER --- //

    updateStatusUI(text, isGood = true) {
        const dot = document.getElementById('status-dot');
        dot.title = text;

        if (isGood) {
            dot.classList.add('connected');
        } else {
            dot.classList.remove('connected');
        }
    },

    generateId() {
        return Math.random().toString(36).substring(2, 9);
    },

    createNewBoard() {
        this.showModal('New Board', 'Enter a name for the new board...', '').then(name => {
            if (name === null) return;
            const newId = this.generateId();
            const boardName = name.trim() || 'Untitled Board';
            localStorage.setItem(`retroboard-name-${newId}`, boardName);
            window.location.hash = newId;
            window.location.reload();
        });
    },

    promptRenameboard() {
        this.showModal('Rename Board', 'Enter a new name...', this.boardName).then(name => {
            if (name === null) return;
            this.boardName = name.trim() || 'Untitled Board';
            this.updateBoardNameUI();
            if (this.isHost) {
                this.saveLocalState();
                this.broadcastState();
            } else {
                this.sendActionToHost({ type: 'RENAME', boardName: this.boardName });
            }
        });
    },

    showModal(title, placeholder, defaultValue) {
        return new Promise(resolve => {
            const overlay = document.getElementById('modal-overlay');
            const input = document.getElementById('modal-input');
            const titleEl = document.getElementById('modal-title');
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');

            titleEl.innerText = title;
            input.placeholder = placeholder;
            input.value = defaultValue || '';
            overlay.classList.add('active');
            setTimeout(() => input.focus(), 50);

            const cleanup = () => {
                overlay.classList.remove('active');
                confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));
                input.removeEventListener('keydown', onKey);
                overlay.removeEventListener('click', onOverlayClick);
            };

            const confirm = () => { cleanup(); resolve(input.value); };
            const cancel = () => { cleanup(); resolve(null); };

            const onKey = (e) => {
                if (e.key === 'Enter') confirm();
                if (e.key === 'Escape') cancel();
            };

            const onOverlayClick = (e) => {
                if (e.target === overlay) cancel();
            };

            input.addEventListener('keydown', onKey);
            overlay.addEventListener('click', onOverlayClick);
            document.getElementById('modal-confirm').addEventListener('click', confirm);
            document.getElementById('modal-cancel').addEventListener('click', cancel);
        });
    },

    updateUserNameUI() {
        const name = this.userName || 'Guest';
        document.getElementById('user-name-display').innerText = name;
        document.getElementById('user-avatar').innerText = name[0].toUpperCase();
    },

    promptChangeUserName() {
        this.showModal('Change Your Name', 'Enter your name...', this.userName || '').then(name => {
            if (name === null) return;
            this.userName = (name && name.trim()) || 'Anonymous';
            localStorage.setItem('retroboard-username', this.userName);
            this.updateUserNameUI();
            // Re-announce to host if guest, or rebuild if host
            if (this.isHost) {
                this.rebuildOnlineUsers();
                this.broadcastState();
            } else if (this.hostConnection && this.hostConnection.open) {
                this.hostConnection.send({ type: 'ANNOUNCE', userName: this.userName });
            }
        });
    },

    renderOnlineUsers() {
        const listEl = document.getElementById('users-list');
        const countEl = document.getElementById('users-count');
        if (!listEl) return;

        const count = this.onlineUsers.length;
        countEl.innerText = `${count} online`;

        listEl.innerHTML = this.onlineUsers.map(u => {
            const initial = (u.name || '?')[0].toUpperCase();
            const avatarClass = u.isHost ? 'user-presence-avatar host-avatar' : 'user-presence-avatar';
            const label = u.isHost ? `${u.name} (host)` : u.name;
            return `
                <div class="user-presence-item" title="${label}">
                    <span class="${avatarClass}">${initial}</span>
                    <span class="user-presence-name">${label}</span>
                </div>
            `;
        }).join('');
    },

    updateBoardNameUI() {
        const el = document.getElementById('board-name-text');
        if (el) el.innerText = this.boardName;
        document.title = `${this.boardName} | RetroBoard`;
    },

    // --- BOARD SWITCHER --- //

    getAllBoards() {
        const boards = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('retroboard-state-')) {
                const id = key.replace('retroboard-state-', '');
                const name = localStorage.getItem(`retroboard-name-${id}`) || 'Untitled Board';
                let cardCount = 0;
                try {
                    const state = JSON.parse(localStorage.getItem(key));
                    cardCount = Object.values(state).reduce((sum, col) => sum + col.length, 0);
                } catch (e) { }
                boards.push({ id, name, cardCount });
            }
        }
        return boards;
    },

    toggleBoardsPanel() {
        const panel = document.getElementById('boards-panel');
        const overlay = document.getElementById('boards-panel-overlay');
        const isOpen = panel.classList.contains('open');
        if (isOpen) {
            this.closeBoardsPanel();
        } else {
            this.renderBoardsList();
            panel.classList.add('open');
            overlay.classList.add('active');
        }
    },

    closeBoardsPanel() {
        document.getElementById('boards-panel').classList.remove('open');
        document.getElementById('boards-panel-overlay').classList.remove('active');
    },

    renderBoardsList() {
        const boards = this.getAllBoards();
        const listEl = document.getElementById('boards-list');

        if (boards.length === 0) {
            listEl.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary); opacity: 0.5;">No boards yet</div>';
            return;
        }

        listEl.innerHTML = boards.map(b => `
            <div class="board-item ${b.id === this.boardId ? 'active' : ''}" onclick="app.switchToBoard('${b.id}')">
                <span class="board-item-dot"></span>
                <div class="board-item-info">
                    <div class="board-item-name">${b.name}</div>
                    <div class="board-item-id">#${b.id}</div>
                </div>
                <span class="board-item-cards">${b.cardCount} card${b.cardCount !== 1 ? 's' : ''}</span>
            </div>
        `).join('');
    },

    switchToBoard(boardId) {
        if (boardId === this.boardId) {
            this.closeBoardsPanel();
            return;
        }
        window.location.hash = boardId;
        window.location.reload();
    },

    copyBoardLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const btn = document.getElementById('share-btn');
            const originalText = btn.innerText;
            btn.innerText = 'Copied!';
            btn.style.background = '#00c853';
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = '';
            }, 2000);
        });
    },

    render() {
        ['went-well', 'to-improve', 'action-items'].forEach(columnId => {
            const listElement = document.getElementById(`list-${columnId}`);
            if (!listElement) return;

            // Sort by timestamp newest first
            const sortedCards = [...this.state[columnId]].sort((a, b) => b.timestamp - a.timestamp);

            let html = '';
            sortedCards.forEach(card => {
                const authorInitial = (card.author || '?')[0].toUpperCase();
                html += `
                    <div class="card" data-id="${card.id}" data-column="${columnId}"
                         draggable="true">
                        <div class="card-text" 
                             contenteditable="true" 
                             onblur="app.updateCard('${columnId}', '${card.id}', this.innerText)"
                             onkeydown="if(event.key==='Enter'){this.blur(); return false;}"
                             data-placeholder="Type something...">${card.text || ''}</div>
                        <div class="card-footer">
                            <div class="card-author" title="${card.author || 'Anonymous'}">
                                <span class="card-author-avatar">${authorInitial}</span>
                                <span class="card-author-name">${card.author || 'Anonymous'}</span>
                            </div>
                            <div class="card-actions-group">
                                <div class="vote-container">
                                    <button class="vote-btn" onclick="app.vote('${columnId}', '${card.id}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M7 10l5-5 5 5"></path>
                                            <path d="M7 14l5 5 5-5"></path>
                                        </svg>
                                        <span>${card.votes || 0}</span>
                                    </button>
                                </div>
                                <button class="delete-btn" onclick="app.deleteCard('${columnId}', '${card.id}')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            // Re-render
            listElement.innerHTML = html;
        });

        this.setupDragAndDrop();
    },

    setupDragAndDrop() {
        // Make cards draggable
        document.querySelectorAll('.card[draggable]').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    cardId: card.dataset.id,
                    fromColumn: card.dataset.column
                }));
                // Delay so the dragging class doesn't affect the drag ghost
                requestAnimationFrame(() => card.classList.add('dragging'));
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.card-list').forEach(el => el.classList.remove('drag-over'));
            });
        });

        // Setup drop zones on card lists
        document.querySelectorAll('.card-list').forEach(list => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                list.classList.add('drag-over');
            });

            list.addEventListener('dragleave', (e) => {
                // Only remove if we actually left the list (not entering a child)
                if (!list.contains(e.relatedTarget)) {
                    list.classList.remove('drag-over');
                }
            });

            list.addEventListener('drop', (e) => {
                e.preventDefault();
                list.classList.remove('drag-over');

                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const toColumnId = list.id.replace('list-', '');
                    this.moveCard(data.fromColumn, toColumnId, data.cardId);
                } catch (err) {
                    console.error('Drop failed:', err);
                }
            });
        });
    }
};

window.addEventListener('hashchange', () => window.location.reload());
app.init();
