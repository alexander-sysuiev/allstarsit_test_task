const STREAM_URL = 'http://localhost:4000/api/stream';
export const connectUnitStream = (onDelta) => {
    const stream = new EventSource(STREAM_URL);
    stream.addEventListener('units.delta', (message) => {
        if (!(message instanceof MessageEvent)) {
            return;
        }
        const payload = JSON.parse(message.data);
        onDelta(payload);
    });
    stream.onerror = () => {
        // TODO: add retry/backoff telemetry and user-visible connection state.
    };
    return () => {
        stream.close();
    };
};
