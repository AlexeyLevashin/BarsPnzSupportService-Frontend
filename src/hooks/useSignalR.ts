import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { tokenUtil } from "../lib/token";

export const useSignalR = () => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl('/hubs/requests', {
                accessTokenFactory: () => {
                    // Всегда берем самый свежий токен из хранилища
                    const { accessToken } = tokenUtil.get();
                    return accessToken || '';
                }
            })
            .withAutomaticReconnect([0, 2000, 10000, 30000])
            .build();

        newConnection.keepAliveIntervalInMilliseconds = 15000;
        newConnection.serverTimeoutInMilliseconds = 60000;

        setConnection(newConnection);

        let isMounted = true; // Защита от утечек памяти при размонтировании

        // 🔥 Выносим логику подключения в отдельную функцию, чтобы уметь её перезапускать
        const startSignalR = async () => {
            try {
                await newConnection.start();
                console.log('SignalR Connected!');
                if (isMounted) setIsConnected(true);
            } catch (err) {
                console.error('SignalR Connection Error:', err);
                // Если мы упали прямо на старте (например, из-за 401),
                // даем Axios'у 5 секунд обновить токен и пробуем снова!
                if (isMounted) {
                    setTimeout(startSignalR, 5000);
                }
            }
        };

        // Запускаем первый раз
        startSignalR();

        newConnection.onreconnecting(() => {
            console.log('SignalR reconnecting...');
            setIsConnected(false);
        });

        newConnection.onreconnected(() => {
            console.log('SignalR reconnected!');
            setIsConnected(true);
        });

        newConnection.onclose((error) => {
            console.log('SignalR connection closed', error);
            setIsConnected(false);

            if (isMounted) {
                console.log('SignalR пытается восстать из мертвых...');
                setTimeout(startSignalR, 3000);
            }
        });

        return () => {
            isMounted = false;
            newConnection.stop();
        };
    }, []);

    return { connection, isConnected };
};