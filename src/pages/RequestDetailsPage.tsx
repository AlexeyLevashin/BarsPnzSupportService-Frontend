import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import '../css/requestDetails.css';

import { requestService } from '../services/request.service';
import { messageService } from '../services/message.service';
import { authService } from '../services/auth.service';
import { fileService } from '../services/file.service';
import { UserRole } from '../types/user.types';
import { Priority, RequestStatus } from '../types/request.types';
import { MessageType } from '../types/message.types';
import type { GetRequestResponse } from '../types/request.types';
import type { GetMessageResponse } from '../types/message.types';
import { useSignalR } from "../hooks/useSignalR";

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

    // Стейт и реф для файлов
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedFiles, setAttachedFiles] = useState<{
        localId: string;
        file: File;
        id?: string;
        isUploading: boolean;
        error?: string;
    }[]>([]);

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
        if (!connection || !isConnected || !id) return;
        if (connection.state !== "Connected") return;

        const handleReceiveMessage = (newMessage: GetMessageResponse) => {
            setChatFeed(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            });

            if (newMessage.senderId !== currentUser?.id) {
                toast('Новое сообщение в чате!', { icon: '💬' });
            }
        };

        connection.on("ReceiveMessage", handleReceiveMessage);
        connection.invoke("JoinRequestGroup", id, hasInternalAccess)
            .catch(err => console.error("Ошибка входа в группу:", err));

        return () => {
            connection.off("ReceiveMessage", handleReceiveMessage);
            if (connection.state === "Connected") {
                connection.invoke("LeaveRequestGroup", id).catch(console.error);
            }
        };
    }, [connection, isConnected, id, hasInternalAccess]);

    // Обработка выбора файлов
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);

        const newAttachments = files.map(file => ({
            localId: Math.random().toString(36).substring(7),
            file,
            isUploading: true
        }));

        setAttachedFiles(prev => [...prev, ...newAttachments]);

        newAttachments.forEach(async (att) => {
            try {
                const fileId = await fileService.upload(att.file);
                setAttachedFiles(prev => prev.map(p =>
                    p.localId === att.localId ? { ...p, id: fileId, isUploading: false } : p
                ));
            } catch (error) {
                setAttachedFiles(prev => prev.map(p =>
                    p.localId === att.localId ? { ...p, isUploading: false, error: 'Ошибка' } : p
                ));
                toast.error(`Не удалось загрузить ${att.file.name}`);
            }
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = (localId: string) => {
        setAttachedFiles(prev => prev.filter(f => f.localId !== localId));
    };

    const handleDownloadClick = async (fileId: string) => {
        try {
            const url = await fileService.getUrl(fileId);
            window.open(url, '_blank');
        } catch {
            toast.error('Не удалось получить ссылку на файл');
        }
    };

    // Отправка сообщения
    const handleSendMessage = async () => {
        const isFilesUploading = attachedFiles.some(f => f.isUploading);
        if (isFilesUploading) {
            toast.error('Дождитесь окончания загрузки файлов');
            return;
        }

        if (!messageText.trim() && attachedFiles.length === 0) return;
        if (!id) return;

        setIsSending(true);
        try {
            const attachmentIds = attachedFiles
                .filter(f => f.id && !f.error)
                .map(f => f.id as string);

            const messagePayload: any = {
                text: messageText,
                type: MessageType.Public
            };

            if (attachmentIds.length > 0) {
                messagePayload.attachmentIds = attachmentIds;
            }

            await messageService.create(id, messagePayload);

            setMessageText('');
            setAttachedFiles([]);
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
                            const isClient = msg.senderId === request.clientId;
                            const isColleague = !isMyMessage && !isClient;
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
                                    {/* Отрисовка прикрепленных файлов в сообщении */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="rd-message-attachments">
                                            {msg.attachments.map(att => (
                                                <div
                                                    key={att.id}
                                                    className="rd-attachment-link"
                                                    onClick={() => handleDownloadClick(att.id)}
                                                >
                                                    📎 {att.fileName}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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

                    {/* Зона предпросмотра прикрепленных файлов */}
                    {attachedFiles.length > 0 && (
                        <div className="rd-attachments-preview">
                            {attachedFiles.map(file => (
                                <div key={file.localId} className={`rd-preview-item ${file.error ? 'error' : ''}`}>
                                    <span className="rd-preview-name">{file.file.name}</span>
                                    {file.isUploading && <span className="rd-preview-loader">⏳</span>}
                                    <button className="rd-preview-remove" onClick={() => handleRemoveFile(file.localId)}>✕</button>
                                </div>
                            ))}
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
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="rd-attach-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Прикрепить файл"
                        >
                            📎
                        </button>

                        <button
                            className={`action-btn-primary ${isInternalMode ? 'rd-back-btn internal' : 'rd-back-btn public'}`}
                            onClick={handleSendMessage}
                            disabled={isSending || (attachedFiles.some(f => f.isUploading)) || (!messageText.trim() && attachedFiles.length === 0)}
                        >
                            {isSending ? 'Отправка...' : 'Отправить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};