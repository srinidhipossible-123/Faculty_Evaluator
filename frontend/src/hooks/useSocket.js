import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const getBackendUrl = () => 'https://faculty-evaluator.onrender.com';

export function useAdminSocket(onEvaluationUpdate) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const onUpdateRef = useRef(onEvaluationUpdate);
  onUpdateRef.current = onEvaluationUpdate;

  useEffect(() => {
    const url = getBackendUrl();
    const socket = io(url || undefined, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.emit('admin:subscribe');
    socket.on('evaluation:updated', (data) => { onUpdateRef.current?.('updated', data); });
    socket.on('evaluation:submitted', (data) => { onUpdateRef.current?.('submitted', data); });
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  return { connected };
}
