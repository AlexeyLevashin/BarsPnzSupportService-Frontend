import React, {useEffect, useRef, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import '../css/institution.css';
// Убедись, что стили для файлов подтянутся (если они лежат в requestDetails.css)
import '../css/requestDetails.css';

import {requestService} from '../services/request.service';
import {authService} from '../services/auth.service';
import {fileService} from '../services/file.service'; // <-- Добавили сервис файлов
import {UserRole} from '../types/user.types';
import type {CreateRequestDto, CreateRequestFormState, GetRequestResponse} from '../types/request.types';
import {Priority, RequestStatus} from '../types/request.types';

import {PageHeader} from '../components/ui/PageHeader';
import {TableToolbar} from '../components/ui/TableToolbar';
import {type ColumnDef, DataTable} from '../components/ui/DataTable';
import {useSignalR} from "../hooks/useSignalR";
import {MessageType} from "../types/message.types";

const priorityOptions = [
    { value: Priority.Normal, label: 'Обычный' },
    { value: Priority.High, label: 'Высокий' },
    { value: Priority.Emergency, label: 'Критический' }
];

const statusLabels: Record<RequestStatus, string> = {
    [RequestStatus.New]: 'Новая',
    [RequestStatus.InProgress]: 'В работе',
    [RequestStatus.ClientDataRequest]: 'Запрос данных',
    [RequestStatus.PendingReview]: 'Ожидает рассмотрения',
    [RequestStatus.Closed]: 'Закрыта',
    [RequestStatus.Canceled]: 'Отменена',
    [RequestStatus.Analysis]: 'Анализ',
};

const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

type TabType = 'received' | 'sent';

export const RequestsPage = () => {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    const hasTabs = currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Operator;

    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const [activeTab, setActiveTab] = useState<TabType>(hasTabs ? 'received' : 'sent');

    const [requests, setRequests] = useState<GetRequestResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<CreateRequestFormState>({
        theme: '', priority: Priority.Normal, messageText: ''
    });

    // --- СТЕЙТЫ ДЛЯ ФАЙЛОВ ---
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<{
        localId: string;
        file: File;
        id?: string;
        isUploading: boolean;
        error?: string;
    }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false); // Для блокировки кнопки сохранения

    const { connection } = useSignalR();

    useEffect(() => {
        if (!connection) return;

        connection.on("NewRequestCreated", (newRequest: GetRequestResponse) => {
            if (activeTab === 'received') {
                setRequests(prev => {
                    if (prev.some(req => req.id === newRequest.id)) return prev;
                    return [newRequest, ...prev];
                });
                toast('Поступила новая заявка!', { icon: '🔔' });
            }
        });

        return () => {
            connection.off("NewRequestCreated");
        };
    }, [connection, activeTab]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = activeTab === 'received'
                ? await requestService.getAll({ page, pageSize })
                : await requestService.getMy({ page, pageSize });

            setRequests(res.items);
            setTotalPages(res.pageInfo.totalPages);
            setHasPrev(res.pageInfo.hasPreviousPage);
            setHasNext(res.pageInfo.hasNextPage);
        } catch (error) {
            toast.error('Ошибка загрузки заявок');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page, pageSize, activeTab]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearchParams({ page: '1' });
    };

    // --- ОБРАБОТКА ФАЙЛОВ В МОДАЛКЕ ---
    const handleAttachClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        (fileInputRef.current as HTMLInputElement)?.click();
    };

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

        if (fileInputRef.current) {
            fileInputRef.current!.value = '';
        }
    };

    const handleRemoveFile = (localId: string) => {
        setAttachedFiles(prev => prev.filter(f => f.localId !== localId));
    };

    // --- СОХРАНЕНИЕ ЗАЯВКИ С ФАЙЛАМИ ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Проверяем, не грузятся ли еще файлы
        const isFilesUploading = attachedFiles.some(f => f.isUploading);
        if (isFilesUploading) {
            toast.error('Дождитесь окончания загрузки файлов');
            return;
        }

        setIsSubmitting(true);
        try {
            const attachmentIds = attachedFiles
                .filter(f => f.id && !f.error)
                .map(f => f.id as string);

            const messageData: any = { text: formData.messageText };

            if (attachmentIds.length > 0) {
                messageData.attachmentIds = attachmentIds;
            }

            const requestPayload: CreateRequestDto = {
                theme: formData.theme,
                priority: formData.priority,
                message: messageData
            };
            await requestService.create(requestPayload);

            toast.success('Заявка успешно создана');

            // Очищаем форму и модалку
            setIsModalOpen(false);
            setFormData({ theme: '', priority: Priority.Normal, messageText: '' });
            setAttachedFiles([]);

            if (activeTab !== 'sent') {
                handleTabChange('sent');
            } else {
                fetchRequests();
            }
        } catch (error) {
            toast.error('Ошибка при создании заявки');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssign = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await requestService.assignToOperator(id);
            toast.success('Заявка взята в работу');
            fetchRequests();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                toast.error('Заявка уже занята другим оператором');
            } else {
                toast.error('Ошибка при назначении');
            }
            fetchRequests();
        }
    };

    const columns: ColumnDef<GetRequestResponse>[] = [
        // ... (Твои колонки оставлены без изменений)
        {
            header: 'ТЕМА',
            renderCell: (item) => (
                <div className="item-name text-truncate" title={item.theme}>
                    {item.theme}
                </div>
            )
        },
        {
            header: 'СОЗДАНА',
            renderCell: (item) => formatDate(item.createdAt)
        },
        {
            header: 'ПРИОРИТЕТ',
            renderCell: (item) => priorityOptions.find(p => p.value === item.priority)?.label || '-'
        },
        {
            header: 'СТАТУС',
            renderCell: (item) => (
                <span className={`status-badge ${item.status === RequestStatus.New ? 'status-new' : 'status-in-progress'}`}>
                    {statusLabels[item.status]}
                </span>
            )
        },
        {
            header: 'УЧРЕЖДЕНИЕ',
            renderCell: (item) => <span className={item.institutionName ? '' : 'text-muted'}>{item.institutionName || '-'}</span>
        },
        {
            header: 'КЛИЕНТ',
            renderCell: (item) => item.clientFullName
        },
        {
            header: 'ОПЕРАТОР',
            renderCell: (item) => <span className={item.operatorFullName ? '' : 'text-muted'}>{item.operatorFullName || '-'}</span>
        },
        {
            header: 'ЗАКРЫТА',
            renderCell: (item) => <span className={item.closedAt ? '' : 'text-muted'}>{formatDate(item.closedAt)}</span>
        },
        {
            header: '',
            width: 140,
            renderCell: (item) => {
                if (item.status === RequestStatus.New && activeTab === 'received') {
                    return (
                        <button
                            className="action-btn-primary btn-sm"
                            onClick={(e) => handleAssign(item.id, e)}
                        >
                            Взять в работу
                        </button>
                    );
                }
                return null;
            }
        }
    ];

    return (
        <div className="content-body">
            <PageHeader
                title="Список заявок"
                actionLabel="Создать заявку"
                onAction={() => setIsModalOpen(true)}
                actionIcon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                }
                leftContent={
                    hasTabs && (
                        <div className="role-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
                                onClick={() => handleTabChange('received')}
                            >
                                Полученные
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
                                onClick={() => handleTabChange('sent')}
                            >
                                Отправленные
                            </button>
                        </div>
                    )
                }
            />

            <div className="data-card">
                {/* ... (Таблица и пагинация оставлены без изменений) ... */}
                <TableToolbar searchPlaceholder="Поиск заявок..." />

                <DataTable<GetRequestResponse>
                    columns={columns}
                    data={requests}
                    isLoading={isLoading}
                    onRowClick={(item) => navigate(`/requests/${item.id}`)}
                    emptyMessage="Заявки не найдены"
                />

                <div className="pagination">
                    <button className="action-btn-secondary" disabled={!hasPrev} onClick={() => setSearchParams({ page: (page - 1).toString() })}>
                        Назад
                    </button>
                    <span className="pagination-info">
                        Страница {page} из {totalPages === 0 ? 1 : totalPages}
                    </span>
                    <button className="action-btn-secondary" disabled={!hasNext} onClick={() => setSearchParams({ page: (page + 1).toString() })}>
                        Вперед
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <>
                    <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} />
                    <div className="modal-panel">
                        <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                        <form onSubmit={handleSave} className="modal-form">
                            <h3>Новая заявка</h3>

                            <div className="form-group">
                                <label>Тема *</label>
                                <input
                                    required
                                    value={formData.theme}
                                    onChange={e => setFormData({...formData, theme: e.target.value})}
                                    placeholder="Краткая суть проблемы"
                                />
                            </div>

                            <div className="form-group">
                                <label>Приоритет *</label>
                                <select
                                    className="form-select"
                                    value={formData.priority}
                                    onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
                                >
                                    {priorityOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Описание проблемы *</label>
                                <textarea
                                    required
                                    value={formData.messageText}
                                    onChange={e => setFormData({...formData, messageText: e.target.value})}
                                    rows={5}
                                    placeholder="Опишите проблему максимально подробно..."
                                />
                            </div>

                            {/* --- ЗОНА ПРИКРЕПЛЕНИЯ ФАЙЛОВ --- */}
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                {/* Отрисовка списка выбранных/загружаемых файлов */}
                                {attachedFiles.length > 0 && (
                                    <div className="rd-attachments-preview" style={{ marginBottom: '10px' }}>
                                        {attachedFiles.map(file => (
                                            <div key={file.localId} className={`rd-preview-item ${file.error ? 'error' : ''}`}>
                                                <span className="rd-preview-name">{file.file.name}</span>
                                                {file.isUploading && <span className="rd-preview-loader">⏳</span>}
                                                <button type="button" className="rd-preview-remove" onClick={() => handleRemoveFile(file.localId)}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />

                                <button
                                    type="button"
                                    className="action-btn-secondary"
                                    onClick={handleAttachClick}
                                    style={{width: 'fit-content'}}
                                >
                                    📎 Прикрепить файлы
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="action-btn-primary modal-submit-btn"
                                disabled={isSubmitting || attachedFiles.some(f => f.isUploading)}
                            >
                                {isSubmitting ? 'Создание...' : 'Отправить заявку'}
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};