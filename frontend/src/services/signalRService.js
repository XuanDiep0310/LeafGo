import * as signalR from "@microsoft/signalr";

let connection = null;

// CRITICAL: Phải dùng relative URL để đi qua Vite proxy
// KHÔNG dùng http://localhost:5191 vì sẽ bypass proxy
const SIGNALR_HUB_URL = "/hubs/ride";

export const createSignalRConnection = (token) => {
    if (connection) {
        return connection;
    }

    console.log(`[SignalR] Creating connection to: ${SIGNALR_HUB_URL}`);
    console.log(`[SignalR] Full URL will be: ${window.location.origin}${SIGNALR_HUB_URL}`);

    connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL, {
            accessTokenFactory: () => {
                const token = localStorage.getItem("accessToken");
                console.log(`[SignalR] Using token: ${token ? 'Present' : 'Missing'}`);
                return token;
            },
            skipNegotiation: false,
            // Try Long Polling first if WebSocket fails through proxy
            transport: signalR.HttpTransportType.LongPolling,
            // Uncomment below to try WebSocket first
            // transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
            withCredentials: true, // Important for proxy
        })
        .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: retryContext => {
                if (retryContext.elapsedMilliseconds < 60000) {
                    return Math.random() * 2000;
                } else {
                    return 10000;
                }
            }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connection.onreconnected((connectionId) => {
        console.log("[SignalR] Reconnected! Connection ID:", connectionId);
    });

    connection.onclose((error) => {
        console.log("[SignalR] Disconnected!", error);
        connection = null;
    });

    connection.onreconnecting((error) => {
        console.log("[SignalR] Reconnecting...", error);
    });

    return connection;
};

export const startSignalRConnection = async (token) => {
    try {
        console.log(`[SignalR] Starting connection...`);
        console.log(`[SignalR] Hub URL: ${SIGNALR_HUB_URL}`);
        console.log(`[SignalR] Origin: ${window.location.origin}`);

        const conn = createSignalRConnection(token);

        if (conn.state === signalR.HubConnectionState.Disconnected) {
            console.log(`[SignalR] Attempting to connect...`);
            await conn.start();
            console.log("[SignalR] ✅ Connected successfully!");
            console.log("[SignalR] Connection ID:", conn.connectionId);
            console.log("[SignalR] Connection state:", conn.state);
            return conn;
        }

        console.log("[SignalR] Already connected. State:", conn.state);
        return conn;
    } catch (error) {
        console.error("[SignalR] ❌ Connection failed:", error);
        console.error("[SignalR] Error details:", {
            message: error.message,
            name: error.name,
            statusCode: error.statusCode,
            hubUrl: SIGNALR_HUB_URL,
            origin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
        });

        if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
            console.error("[SignalR] 🔧 Troubleshooting:");
            console.error("  1. Check if Vite proxy is configured for /hubs/ride");
            console.error("  2. Check if backend container is running: docker ps");
            console.error("  3. Check backend logs: docker logs <api-container>");
            console.error("  4. Test proxy: curl http://localhost:3000/health");
            console.error("  5. Check vite.config.js has ws: true for /hubs");
        }

        console.warn("[SignalR] Continuing without SignalR - using polling fallback");
        connection = null;
        return null;
    }
};

export const stopSignalRConnection = async () => {
    if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
        try {
            await connection.stop();
            console.log("[SignalR] Stopped!");
        } catch (error) {
            console.error("[SignalR] Error stopping connection:", error);
        } finally {
            connection = null;
        }
    }
};

export const getSignalRConnection = () => connection;

export const isConnected = () => {
    return connection && connection.state === signalR.HubConnectionState.Connected;
};

// Invoke methods
export const joinRideGroup = async (rideId) => {
    if (!isConnected()) {
        console.warn("[SignalR] Not connected, skipping joinRideGroup");
        return;
    }
    try {
        await connection.invoke("JoinRideGroup", rideId);
        console.log(`[SignalR] ✅ Joined ride group: ${rideId}`);
    } catch (error) {
        console.error("[SignalR] ❌ Error joining ride group:", error);
        throw error;
    }
};

export const leaveRideGroup = async (rideId) => {
    if (!isConnected()) {
        console.warn("[SignalR] Not connected, skipping leaveRideGroup");
        return;
    }
    try {
        await connection.invoke("LeaveRideGroup", rideId);
        console.log(`[SignalR] ✅ Left ride group: ${rideId}`);
    } catch (error) {
        console.error("[SignalR] ❌ Error leaving ride group:", error);
    }
};

export const updateDriverLocation = async (rideId, latitude, longitude) => {
    if (!isConnected()) {
        console.warn("[SignalR] Not connected, skipping updateDriverLocation");
        return;
    }
    try {
        await connection.invoke("UpdateDriverLocation", rideId, latitude, longitude);
        console.log(`[SignalR] ✅ Updated driver location for ride ${rideId}`);
    } catch (error) {
        console.error("[SignalR] ❌ Error updating location:", error);
    }
};

// On events
export const onNewRideRequest = (callback) => {
    if (connection) {
        connection.on("NewRideRequest", callback);
        console.log("[SignalR] 📡 Registered handler for NewRideRequest");
    }
};

export const onRideAccepted = (callback) => {
    if (connection) {
        connection.on("RideAccepted", callback);
        console.log("[SignalR] 📡 Registered handler for RideAccepted");
    }
};

export const onRideStatusChanged = (callback) => {
    if (connection) {
        connection.on("RideStatusChanged", callback);
        console.log("[SignalR] 📡 Registered handler for RideStatusChanged");
    }
};

export const onDriverLocationUpdated = (callback) => {
    if (connection) {
        connection.on("DriverLocationUpdated", callback);
        console.log("[SignalR] 📡 Registered handler for DriverLocationUpdated");
    }
};

export const onRideCompleted = (callback) => {
    if (connection) {
        connection.on("RideCompleted", callback);
        console.log("[SignalR] 📡 Registered handler for RideCompleted");
    }
};

export const onRideCancelled = (callback) => {
    if (connection) {
        connection.on("RideCancelled", callback);
        console.log("[SignalR] 📡 Registered handler for RideCancelled");
    }
};

// Off events
export const offNewRideRequest = () => {
    if (connection) {
        connection.off("NewRideRequest");
        console.log("[SignalR] 🔇 Removed handler for NewRideRequest");
    }
};

export const offRideAccepted = () => {
    if (connection) {
        connection.off("RideAccepted");
        console.log("[SignalR] 🔇 Removed handler for RideAccepted");
    }
};

export const offRideStatusChanged = () => {
    if (connection) {
        connection.off("RideStatusChanged");
        console.log("[SignalR] 🔇 Removed handler for RideStatusChanged");
    }
};

export const offDriverLocationUpdated = () => {
    if (connection) {
        connection.off("DriverLocationUpdated");
        console.log("[SignalR] 🔇 Removed handler for DriverLocationUpdated");
    }
};

export const offRideCompleted = () => {
    if (connection) {
        connection.off("RideCompleted");
        console.log("[SignalR] 🔇 Removed handler for RideCompleted");
    }
};

export const offRideCancelled = () => {
    if (connection) {
        connection.off("RideCancelled");
        console.log("[SignalR] 🔇 Removed handler for RideCancelled");
    }
};

export default {
    createSignalRConnection,
    startSignalRConnection,
    stopSignalRConnection,
    getSignalRConnection,
    isConnected,
    joinRideGroup,
    leaveRideGroup,
    updateDriverLocation,
    onNewRideRequest,
    onRideAccepted,
    onRideStatusChanged,
    onDriverLocationUpdated,
    onRideCompleted,
    onRideCancelled,
    offNewRideRequest,
    offRideAccepted,
    offRideStatusChanged,
    offDriverLocationUpdated,
    offRideCompleted,
    offRideCancelled,
};