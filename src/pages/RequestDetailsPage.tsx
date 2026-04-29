import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import '../css/requestDetails.css';

import { requestService } from '../services/request.service';
import { messageService } from '../services/message.service';
import { authService } from '../services/auth.service';
import { UserRole } from '../types/user.types';
import { Priority, RequestStatus } from '../types/request.types';
import { MessageType } from '../types/message.types';
import type { GetRequestResponse } from '../types/request.types';
import type { GetMessageResponse } from '../types/message.types';
import {useSignalR} from "../hooks/useSignalR";

const priorityLabels: Record<Priority, string> = {
    [Priority.Normal]: 'Обычный',
    [Priority.High]: 'Высокий',
    [Priority.Emergency]: 'Критический'
};

const statusLabels: Record<RequestStatus, string> = {
    [RequestStatus.New]: 'Новая',
    [RequestStatus.InProgress]: 'В работе',
    [RequestStatus.ClientDataRequest]: 'Запрос данных',
    [RequestStatus.PendingReview]: 'Ожидает проверки',
    [RequestStatus.Closed]: 'Закрыта',
    [RequestStatus.Canceled]: 'Отменена',
    [RequestStatus.Analysis]: 'Анализ'
};

const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export const RequestDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    const hasInternalAccess = currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Operator;

    const [request, setRequest] = useState<GetRequestResponse | null>(null);
    const [chatFeed, setChatFeed] = useState<GetMessageResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [inputTab, setInputTab] = useState<MessageType>(MessageType.Public);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        const el = messagesEndRef.current as any;

        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatFeed]);

    const loadData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const reqData = await requestService.getById(id);
            setRequest(reqData);

            const msgRes = await messageService.getMessages(id, { page: 1, pageSize: 50 });
            let allMessages = [...msgRes.items];

            if (hasInternalAccess) {
                const commentsRes = await messageService.getComments(id, { page: 1, pageSize: 50 });
                allMessages = [...allMessages, ...commentsRes.items];
            }

            allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setChatFeed(allMessages);

        } catch (error) {
            toast.error('Ошибка загрузки заявки');
            navigate('/requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const { connection, isConnected } = useSignalR();
    useEffect(() => {
        // 1. Базовые проверки на наличие нужных переменных
        if (!connection || !isConnected || !id) return;

        // 🛡 2. ЖЕСТКАЯ ПРОВЕРКА СТАТУСА!
        // Спасает от ошибки "Cannot send data if the connection is not in the 'Connected' State"
        if (connection.state !== "Connected") return;

        console.log("Пытаемся зайти в комнату заявки:", id);

        // Входим в нужные комнаты
        connection.invoke("JoinRequestGroup", id, hasInternalAccess)
            .catch(err => console.error("Ошибка входа в группу:", err));

        connection.on("ReceiveMessage", (newMessage: GetMessageResponse) => {
            setChatFeed(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            });

            if (newMessage.senderId !== currentUser?.id) {
                toast('Новое сообщение в чате!', { icon: '💬' });
            }
        });

        return () => {
            connection.off("ReceiveMessage");
            // 🛡 Обязательно проверяем статус перед выходом, чтобы не крашнуться, если связь уже оборвалась
            if (connection.state === "Connected") {
                connection.invoke("LeaveRequestGroup", id, hasInternalAccess).catch(console.error);
            }
        };
    }, [connection, isConnected, id, hasInternalAccess]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !id) return;

        setIsSending(true);
        try {
            await messageService.create(id, {
                text: messageText,
                type: inputTab
            });

            setMessageText('');
        } catch (error) {
            toast.error('Ошибка при отправке');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading || !request) return <div style={{ padding: '20px' }}>Загрузка...</div>;

    const isInternalMode = inputTab === MessageType.Internal;

    return (
        <div className="content-body rd-container">
            <div className="rd-header">
                <h2 className="rd-page-title">Заявка #{request.id.substring(0, 8)}</h2>
                <button
                    className={`action-btn-primary rd-back-btn ${isInternalMode ? 'internal' : 'public'}`}
                    onClick={() => navigate('/requests')}
                >
                    ← К списку заявок
                </button>
            </div>

            <div className="data-card rd-info-card">
                <h3 className="rd-info-title">{request.theme}</h3>
                <div className="rd-info-grid">
                    <div>
                        <span className="rd-info-label">Статус:</span>{' '}
                        <strong className={`status-badge ${request.status === RequestStatus.New ? 'status-new' : 'status-in-progress'}`}>
                            {statusLabels[request.status]}
                        </strong>
                    </div>
                    <div>
                        <span className="rd-info-label">Приоритет: </span>
                        <strong>{priorityLabels[request.priority]}</strong>
                    </div>
                    <div>
                        <span className="rd-info-label">Создана: </span>
                        <strong>{formatDate(request.createdAt)}</strong>
                    </div>
                    <div>
                        <span className="rd-info-label">Учреждение: </span>
                        <strong>{request.institutionName || '-'}</strong>
                    </div>
                    <div>
                        <span className="rd-info-label">Клиент: </span>
                        <strong>{request.clientFullName}</strong>
                    </div>
                    <div>
                        <span className="rd-info-label">Оператор: </span>
                        <strong className={request.operatorFullName ? '' : 'rd-text-muted'}>
                            {request.operatorFullName || 'Не назначен'}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="data-card rd-chat-card">
                <div className="rd-chat-feed">
                    {chatFeed.length === 0 ? (
                        <div className="rd-chat-empty">Нет сообщений</div>
                    ) : (
                        chatFeed.map(msg => {
                            const isMyMessage = msg.senderId === currentUser?.id;
                            const isClient = msg.senderId === request.clientId; // Проверяем, клиент ли это
                            const isColleague = !isMyMessage && !isClient;      // Значит это коллега
                            const isInternal = msg.type === MessageType.Internal;

                            let alignClass = '';
                            if (isMyMessage) {
                                alignClass = 'my-message';
                            } else if (isClient) {
                                alignClass = 'other-message client';
                            } else if (isColleague) {
                                alignClass = 'other-message colleague';
                            }

                            const typeClass = isInternal ? 'internal' : 'public';

                            return (
                                <div key={msg.id} className={`rd-message-bubble ${alignClass} ${typeClass}`}>
                                    <div className={`rd-message-header ${isInternal ? 'internal' : ''}`}>
                                        <div className="rd-message-sender-box">
                                            <strong className={`rd-message-sender ${isInternal ? 'internal' : ''}`}>
                                                {msg.senderFullName}
                                            </strong>

                                            {isInternal && (
                                                <span className="rd-badge-internal">скрыто от клиента</span>
                                            )}
                                            {isColleague && !isInternal && (
                                                <span className="rd-badge-colleague">Оператор</span>
                                            )}

                                        </div>
                                        <span className={`rd-message-time ${isInternal ? 'internal' : ''}`}>
                                            {formatDate(msg.createdAt)}
                                        </span>
                                    </div>
                                    <div className="rd-message-text">
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} style={{ height: '1px', clear: 'both' }} />
                </div>

                <div className="rd-input-area">
                    {hasInternalAccess && (
                        <div className="rd-tabs">
                            <button
                                onClick={() => setInputTab(MessageType.Public)}
                                className={`rd-tab-btn ${!isInternalMode ? 'active public' : 'inactive'}`}
                            >
                                Ответить клиенту
                            </button>

                            <button
                                onClick={() => setInputTab(MessageType.Internal)}
                                className={`rd-tab-btn ${isInternalMode ? 'active internal' : 'inactive'}`}
                            >
                                Написать комментарий
                            </button>
                        </div>
                    )}

                    <textarea
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder={isInternalMode ? "Напишите внутреннюю заметку для коллег..." : "Напишите сообщение..."}
                        rows={3}
                        className={`rd-textarea ${isInternalMode ? 'internal' : 'public'}`}
                    />

                    <div className="rd-input-actions">
                        <button
                            className={`action-btn-primary ${isInternalMode ? 'rd-back-btn internal' : 'rd-back-btn public'}`}
                            onClick={handleSendMessage}
                            disabled={isSending || !messageText.trim()}
                        >
                            {isSending ? 'Отправка...' : 'Отправить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};