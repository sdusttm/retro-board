import '@testing-library/jest-dom';

// Mock PeerJS global
class MockPeer {
    constructor(id, options) {
        this.id = id;
        this._handlers = {};
        MockPeer.lastInstance = this;
        MockPeer.instances.push(this);
    }
    on(event, handler) {
        this._handlers[event] = handler;
        return this;
    }
    connect(id, options) {
        const conn = {
            on: vi.fn((event, handler) => {
                conn._handlers = conn._handlers || {};
                conn._handlers[event] = handler;
            }),
            send: vi.fn(),
            open: true,
            _handlers: {}
        };
        return conn;
    }
    destroy() {}
    _emit(event, data) {
        if (this._handlers[event]) this._handlers[event](data);
    }
}
MockPeer.instances = [];
MockPeer.lastInstance = null;

globalThis.Peer = MockPeer;

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
});

// Mock window.location
const originalLocation = window.location;
delete window.location;
window.location = {
    ...originalLocation,
    hash: '',
    href: 'http://localhost/#test123',
    reload: vi.fn(),
};

// Clear state between tests
beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.location.hash = '';
    window.location.href = 'http://localhost/#test123';
    MockPeer.instances = [];
    MockPeer.lastInstance = null;
});
