import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { tokenUtil } from "../lib/token";
import { authService } from "../services/auth.service";

export const useSignalR = () => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        let currentConnection: signalR.HubConnection | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout>;

        const buildAndStartConnection = async () => {
            if (!isMounted.current) return;

            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl('/hubs/requests', {
                    accessTokenFactory: () => {
                        const { accessToken } = tokenUtil.get();
                        return accessToken || '';
                    }
                })
                .build();

            newConnection.keepAliveIntervalInMilliseconds = 15000;
            newConnection.serverTimeoutInMilliseconds = 60000;

            newConnection.onclose((error) => {
                console.log('SignalR умер. Пересоздаем с нуля...', error);
                if (isMounted.current) {
                    setIsConnected(false);
                    reconnectTimer = setTimeout(buildAndStartConnection, 3000);
                }
            });

            try {
                await newConnection.start();

                if (!isMounted.current) {
                    newConnection.stop();
                    return;
                }

                console.log('SignalR подключен (Чистый запуск)!');
                currentConnection = newConnection;
                setConnection(newConnection);
                setIsConnected(true);

            } catch (err: any) {
                console.error('Ошибка старта SignalR:', err);

                if (!isMounted.current) return;

                const errorMessage = err?.toString() || '';
                if (errorMessage.includes('401')) {
                    console.log('SignalR поймал 401. Пытаюсь обновить токен принудительно...');

                    try {
                        await authService.refreshToken();

                        reconnectTimer = setTimeout(buildAndStartConnection, 1000);
                        return;

                    } catch (refreshErr) {
                        console.error('Не удалось обновить токен. Похоже, сессия мертва полностью.', refreshErr);
                    }
                }
                reconnectTimer = setTimeout(buildAndStartConnection, 5000);
            }
        };

        buildAndStartConnection();

        return () => {
            isMounted.current = false;
            clearTimeout(reconnectTimer);
            if (currentConnection) {
                currentConnection.stop();
            }
        };
    }, []);

    return { connection, isConnected };
};