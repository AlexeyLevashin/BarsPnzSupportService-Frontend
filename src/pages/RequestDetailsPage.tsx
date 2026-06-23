import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import '../css/requestDetails.css';

import { requestService } from '../services/request.service';
import { messageService } from '../services/message.service';
import { authService } from '../services/auth.service';
import { fileService } from '../services/file.service';
import { userService } from '../services/user.service'; // Добавили для загрузки операторов

import { UserRole } from '../types/user.types';
import { Priority, RequestStatus } from '../types/request.types';
import { MessageType } from '../types/message.types';
import type { GetRequestResponse } from '../types/request.types';
import type { GetMessageResponse, CreateMessageDto } from '../types/message.types';
import type { GetOperatorResponse } from '../types/user.types'; // Тип оператора

import { useSignalR } from "../hooks/useSignalR";
import { getErrorMessage } from '../lib/errorHandler';

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

    // Стейт для реактивного статуса
    const [selectedStatus, setSelectedStatus] = useState<RequestStatus>(RequestStatus.InProgress);

    // Стейты для загрузки файлов
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedFiles, setAttachedFiles] = useState<{ localId: string; file: File; id?: string; isUploading: boolean; error?: string; }[]>([]);

    // Стейты для назначения оператора
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [operators, setOperators] = useState<GetOperatorResponse[]>([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        const el = messagesEndRef.current as any;
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [chatFeed]);

    const loadData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const reqData = await requestService.getById(id);
            setRequest(reqData);
            setSelectedStatus(reqData.status);

            const msgRes = await messageService.getMessages(id, { page: 1, pageSize: 50 });
            let allMessages = [...msgRes.items];

            if (hasInternalAccess) {
                const commentsRes = await messageService.getComments(id, { page: 1, pageSize: 50 });
                allMessages = [...allMessages, ...commentsRes.items];
            }

            allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setChatFeed(allMessages);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка загрузки заявки'));
            navigate('/requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [id]);

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
        connection.invoke("JoinRequestGroup", id, hasInternalAccess).catch(e => console.error(getErrorMessage(e, 'Ошибка подключения к чату')));

        return () => {
            connection.off("ReceiveMessage", handleReceiveMessage);
            if (connection.state === "Connected") connection.invoke("LeaveRequestGroup", id).catch(e => console.error(getErrorMessage(e, 'Ошибка отключения от чата')));
        };
    }, [connection, isConnected, id, hasInternalAccess]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({ localId: Math.random().toString(36).substring(7), file, isUploading: true }));
        setAttachedFiles(prev => [...prev, ...newAttachments]);

        newAttachments.forEach(async (att) => {
            try {
                const fileId = await fileService.upload(att.file);
                setAttachedFiles(prev => prev.map(p => p.localId === att.localId ? { ...p, id: fileId, isUploading: false } : p));
            } catch (error) {
                setAttachedFiles(prev => prev.map(p => p.localId === att.localId ? { ...p, isUploading: false, error: 'Ошибка' } : p));
                toast.error(getErrorMessage(error, `Не удалось загрузить ${att.file.name}`));
            }
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = async (localId: string) => {
        const fileToRemove = attachedFiles.find(f => f.localId === localId);
        setAttachedFiles(prev => prev.filter(f => f.localId !== localId));
        if (fileToRemove?.id && !fileToRemove.error) {
            try {
                await fileService.delete(fileToRemove.id);
            } catch (error) {
                console.error(getErrorMessage(error, 'Ошибка удаления файла на сервере'));
            }
        }
    };

    const handleDownloadClick = async (fileId: string) => {
        try {
            const url = await fileService.getUrl(fileId);
            window.open(url, '_blank');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось получить ссылку на файл'));
        }
    };

    // --- ФУНКЦИИ УПРАВЛЕНИЯ ЗАЯВКОЙ ---

    const handleTakeInWork = async () => {
        if (!id) return;
        try {
            await requestService.takeInWork(id);
            toast.success('Заявка взята в работу');
            loadData(); // Перезагружаем карточку, чтобы обновить статусы и список операторов
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при взятии в работу'));
        }
    };

    const openAssignModal = async () => {
        setIsAssignModalOpen(true);
        if (operators.length === 0) {
            try {
                const ops = await userService.getOperators();
                setOperators(ops);
                if (ops.length > 0) setSelectedOperatorId(ops[0]?.id || '');
            } catch (error) {
                toast.error(getErrorMessage(error, 'Не удалось загрузить список сотрудников'));
            }
        } else {
            if (operators.length > 0) setSelectedOperatorId(operators[0]?.id || '');
        }
    };

    const handleAssignSubmit = async () => {
        if (!id || !selectedOperatorId) return;
        setIsAssigning(true);

        try {
            await requestService.assignToOperator(id, selectedOperatorId);
            toast.success('Оператор успешно назначен');
            setIsAssignModalOpen(false);
            loadData();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при назначении оператора'));
        } finally {
            setIsAssigning(false);
        }
    };

    // --- РЕАКТИВНОЕ ИЗМЕНЕНИЕ СТАТУСА ПРИ ВВОДЕ ---
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;

        if (
            hasInternalAccess &&
            messageText.length === 0 &&
            newText.length > 0 &&
            selectedStatus === RequestStatus.InProgress &&
            inputTab === MessageType.Public
        ) {
            setSelectedStatus(RequestStatus.PendingReview);
        }

        setMessageText(newText);
    };

    // --- ДОСТУПНЫЕ СТАТУСЫ В СЕЛЕКТОРЕ ---
    const availableStatuses = useMemo(() => {
        if (!hasInternalAccess) {
            return [RequestStatus.InProgress, RequestStatus.Closed];
        }

        return [
            RequestStatus.InProgress,
            RequestStatus.ClientDataRequest,
            RequestStatus.PendingReview,
            RequestStatus.Closed,
            RequestStatus.Canceled
        ];
    }, [hasInternalAccess]);

    useEffect(() => {
        if (!availableStatuses.includes(selectedStatus) && availableStatuses.length > 0) {
            setSelectedStatus(availableStatuses[0] as RequestStatus);
        }
    }, [availableStatuses, selectedStatus]);

    // --- УМНАЯ НАДПИСЬ НА КНОПКЕ ---
    const getButtonLabel = () => {
        if (isSending) return 'Обработка...';

        const hasContent = messageText.trim().length > 0 || attachedFiles.length > 0;

        if (!hasContent) {
            if (selectedStatus === RequestStatus.Closed) return 'Закрыть заявку';
            if (selectedStatus === RequestStatus.Canceled) return 'Отменить заявку';
            return 'Отправить';
        }

        if (selectedStatus === RequestStatus.PendingReview) return 'Отправить';
        if (selectedStatus === RequestStatus.ClientDataRequest) return 'Отправить';
        if (selectedStatus === RequestStatus.Closed) return 'Отправить и закрыть';

        return 'Отправить';
    };

    // --- ОТПРАВКА СООБЩЕНИЯ / СМЕНА СТАТУСА ---
    const handleSendMessage = async () => {
        if (attachedFiles.some(f => f.isUploading)) {
            toast.error('Дождитесь окончания загрузки файлов');
            return;
        }
        if (!id) return;

        const hasContent = messageText.trim().length > 0 || attachedFiles.length > 0;
        setIsSending(true);

        try {
            if (!hasContent) {
                await requestService.terminate(id, selectedStatus);
                toast.success('Статус заявки обновлен');
            } else {
                const attachmentIds = attachedFiles.filter(f => f.id && !f.error).map(f => f.id as string);

                const messagePayload: CreateMessageDto = {
                    text: messageText,
                    type: inputTab,
                    status: selectedStatus
                };

                if (attachmentIds && attachmentIds.length > 0) {
                    messagePayload.attachmentIds = attachmentIds;
                }

                await messageService.create(id, messagePayload);
            }

            setMessageText('');
            setAttachedFiles([]);
            loadData();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при выполнении действия'));
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading || !request) return <div style={{ padding: '20px' }}>Загрузка...</div>;
    const isInternalMode = inputTab === MessageType.Internal;
    const handleBack = () => {
        // Если история браузера позволяет вернуться назад — возвращаемся, иначе идем в список
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/requests');
        }
    };

    return (
        <div className="content-body rd-container">
            <div className="rd-header">
                <h2 className="rd-page-title">Заявка #{request.id.substring(0, 8)}</h2>
                <button className={`action-btn-primary rd-back-btn ${isInternalMode ? 'internal' : 'public'}`} onClick={handleBack}>← К списку заявок</button>
            </div>

            <div className="data-card rd-info-card">
                <h3 className="rd-info-title">{request.theme}</h3>

                {/* Основная информация о заявке */}
                <div className="rd-info-grid">
                    <div><span className="rd-info-label">Статус:</span> <strong className={`status-badge ${request.status === RequestStatus.New ? 'status-new' : 'status-in-progress'}`}>{statusLabels[request.status]}</strong></div>
                    <div><span className="rd-info-label">Приоритет: </span><strong>{priorityLabels[request.priority]}</strong></div>
                    <div><span className="rd-info-label">Создана: </span><strong>{formatDate(request.createdAt)}</strong></div>
                    <div><span className="rd-info-label">Учреждение: </span><strong>{request.institutionName || '-'}</strong></div>
                    <div><span className="rd-info-label">Клиент: </span><strong>{request.clientFullName}</strong></div>
                    <div>
                        <span className="rd-info-label">Оператор: </span>
                        <strong className={request.operators && request.operators.length > 0 ? '' : 'rd-text-muted'}>
                            {request.operators && request.operators.length > 0
                                ? request.operators.map(op => op.operatorFullName).join(', ')
                                : 'Не назначен'}
                        </strong>
                    </div>
                </div>

                {/* Панель управления заявкой (видна только операторам) */}
                {hasInternalAccess && (
                    <div style={{
                        marginTop: '20px',
                        paddingTop: '15px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                    }}>
                        {
                            // Проверяем:
                            // 1. Статус не "Закрыта" или "Отменена"
                            // 2. Текущий юзер еще не в списке операторов заявки
                            request.status !== RequestStatus.Closed &&
                            request.status !== RequestStatus.Canceled &&
                            !request.operators?.some(op => op.id === currentUser?.id) && (
                                <button className="action-btn-primary" onClick={handleTakeInWork}>
                                    Взять в работу
                                </button>
                            )
                        }
                        <button className="action-btn-secondary" onClick={openAssignModal}>
                            Назначить оператора
                        </button>
                    </div>
                )}
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

                            let alignClass = isMyMessage ? 'my-message' : isClient ? 'other-message client' : 'other-message colleague';
                            const typeClass = isInternal ? 'internal' : 'public';

                            return (
                                <div key={msg.id} className={`rd-message-bubble ${alignClass} ${typeClass}`}>
                                    <div className={`rd-message-header ${isInternal ? 'internal' : ''}`}>
                                        <div className="rd-message-sender-box">
                                            <strong className={`rd-message-sender ${isInternal ? 'internal' : ''}`}>{msg.senderFullName}</strong>
                                            {isInternal && <span className="rd-badge-internal">скрыто от клиента</span>}
                                            {isColleague && !isInternal && <span className="rd-badge-colleague">Оператор</span>}
                                        </div>
                                        <span className={`rd-message-time ${isInternal ? 'internal' : ''}`}>{formatDate(msg.createdAt)}</span>
                                    </div>
                                    <div className="rd-message-text">{msg.text}</div>
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="rd-message-attachments">
                                            {msg.attachments.map(att => (
                                                <div key={att.id} className="rd-attachment-link" onClick={() => handleDownloadClick(att.id)}>📎 {att.fileName}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} style={{ height: '1px', clear: 'both' }} />
                </div>

                {request.status === RequestStatus.Closed || request.status === RequestStatus.Canceled ? (
                    <div className="rd-input-area" style={{ textAlign: 'center', padding: '20px', color: '#6c757d', backgroundColor: '#f8f9fa' }}>
                        <em>Эта заявка {request.status === RequestStatus.Closed ? 'закрыта' : 'отменена'}. Отправка сообщений недоступна.</em>
                    </div>
                ) : (
                    <div className="rd-input-area">
                        {hasInternalAccess && (
                            <div className="rd-tabs">
                                <button onClick={() => setInputTab(MessageType.Public)} className={`rd-tab-btn ${!isInternalMode ? 'active public' : 'inactive'}`}>Ответить клиенту</button>
                                <button onClick={() => setInputTab(MessageType.Internal)} className={`rd-tab-btn ${isInternalMode ? 'active internal' : 'inactive'}`}>Написать комментарий</button>
                            </div>
                        )}

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
                            onChange={handleTextChange}
                            placeholder={isInternalMode ? "Напишите внутреннюю заметку для коллег..." : "Напишите сообщение..."}
                            rows={3}
                            className={`rd-textarea ${isInternalMode ? 'internal' : 'public'}`}
                        />

                        <div className="rd-input-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                            <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect}
                                   style={{display: 'none'}}/>
                            <button className="rd-attach-btn" onClick={() => fileInputRef.current?.click()}
                                    title="Прикрепить файл">📎
                            </button>

                            {inputTab !== MessageType.Internal && (
                                <select
                                    className="form-select"
                                    style={{width: 'auto', minWidth: '180px'}}
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value as RequestStatus)}
                                >
                                    {availableStatuses.map(st => (
                                        <option key={st} value={st}>
                                            {st === RequestStatus.InProgress && !hasInternalAccess ? 'Ответить' : statusLabels[st]}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <button
                                className={`action-btn-primary ${isInternalMode ? 'rd-back-btn internal' : 'rd-back-btn public'}`}
                                onClick={handleSendMessage}
                                disabled={
                                    isSending || // 1. Идет отправка
                                    attachedFiles.some(f => f.isUploading) || // 2. Еще грузятся файлы
                                    // 3. БЛОКИРУЕМ, если:
                                    //    - Нет текста И нет файлов
                                    //    - И при этом статус НЕ является "Закрыта" или "Отменена"
                                    (!messageText.trim() && attachedFiles.length === 0 &&
                                        selectedStatus !== RequestStatus.Closed &&
                                        selectedStatus !== RequestStatus.Canceled)
                                }
                            >
                                {getButtonLabel()}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Модалка назначения оператора */}
            {isAssignModalOpen && (
                <>
                    <div
                        onClick={() => setIsAssignModalOpen(false)}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 999
                        }}
                    />
                    <div className="modal-panel" style={{
                        position: 'fixed',
                        zIndex: 1000, maxWidth: '400px', width: '100%', margin: 'auto', left: 0, right: 0, top: '30%', backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}>
                        <button className="close-btn" onClick={() => setIsAssignModalOpen(false)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                        <h3 style={{ marginTop: 0 }}>Назначение оператора</h3>

                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Выберите сотрудника:</label>
                            <select
                                className="form-select"
                                value={selectedOperatorId}
                                onChange={(e) => setSelectedOperatorId(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                <option value="" disabled>-- Выберите оператора --</option>
                                {operators.map(op => (
                                    <option key={op.id} value={op.id}>
                                        {op.operatorFullName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="action-btn-secondary" onClick={() => setIsAssignModalOpen(false)}>
                                Отмена
                            </button>
                            <button className="action-btn-primary" onClick={handleAssignSubmit} disabled={isAssigning || !selectedOperatorId}>
                                {isAssigning ? 'Назначение...' : 'Назначить'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};