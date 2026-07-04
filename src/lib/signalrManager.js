import * as signalR from '@microsoft/signalr';

/**
 * Derives the hub base URL from the API base URL.
 * e.g.  http://host:port/api  →  http://host:port
 */
function getHubBaseUrl() {
    const apiBase = process.env.REACT_APP_API_BASE_URL || '';
    return apiBase.replace(/\/api\/?$/, '');
}

const HUB_URL = `${getHubBaseUrl()}/downloadHub`;


console.log("HUB_URL", HUB_URL);

class SignalRManager {
    constructor() {
        this._connection = null;
        this._listeners = {}; // eventName → Set of callbacks
        this._connecting = false;
    }

    /**
     * Build and start the hub connection (idempotent).
     */
    async connect() {
        if (
            this._connection &&
            this._connection.state === signalR.HubConnectionState.Connected
        ) {
            return;
        }

        if (this._connecting) return;
        this._connecting = true;

        try {
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL, {
                    withCredentials: false,
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Warning)
                .build();

            // Wire up all currently registered listeners
            Object.entries(this._listeners).forEach(([event, callbacks]) => {
                callbacks.forEach((cb) => connection.on(event, cb));
            });

            await connection.start();
            this._connection = connection;
            console.info('[SignalR] Connected to', HUB_URL);
        } catch (err) {
            console.error('[SignalR] Connection failed:', err);
        } finally {
            this._connecting = false;
        }
    }

    /**
     * Subscribe to a SignalR event.
     * Safe to call before connect() — events are queued and applied on connection start.
     */
    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = new Set();
        }
        this._listeners[event].add(callback);

        // If already connected, register immediately
        if (
            this._connection &&
            this._connection.state === signalR.HubConnectionState.Connected
        ) {
            this._connection.on(event, callback);
        }
    }

    /**
     * Unsubscribe from a SignalR event.
     */
    off(event, callback) {
        if (this._listeners[event]) {
            this._listeners[event].delete(callback);
        }
        if (
            this._connection &&
            this._connection.state === signalR.HubConnectionState.Connected
        ) {
            this._connection.off(event, callback);
        }
    }

    /**
     * Gracefully stop the connection.
     */
    async disconnect() {
        if (this._connection) {
            try {
                await this._connection.stop();
                console.info('[SignalR] Disconnected.');
            } catch (err) {
                console.warn('[SignalR] Error during disconnect:', err);
            }
            this._connection = null;
        }
    }

    get isConnected() {
        return (
            this._connection?.state === signalR.HubConnectionState.Connected
        );
    }
}

// Export a singleton instance
const signalRManager = new SignalRManager();
export default signalRManager;
