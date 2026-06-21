import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import '../css/institution.css';
import '../css/requestDetails.css';

import { requestService } from '../services/request.service';
import { authService } from '../services/auth.service';
import { fileService } from '../services/file.service';
import { UserRole } from '../types/user.types';
import type { CreateRequestDto, CreateRequestFormState, GetRequestResponse } from '../types/request.types';
import { Priority, RequestStatus } from '../types/request.types';
import { userService } from '../services/user.service';
import type { GetOperatorResponse } from '../types/user.types';

import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { type ColumnDef, DataTable } from '../components/ui/DataTable';
import { useSignalR } from "../hooks/useSignalR";

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

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<{ localId: string; file: File; id?: string; isUploading: boolean; error?: string; }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [activeMenuRowId, setActiveMenuRowId] = useState<string | null>(null);
    const [terminateModalParams, setTerminateModalParams] = useState<{ isOpen: boolean; requestId: string; currentStatus: RequestStatus } | null>(null);

    const [assignModalParams, setAssignModalParams] = useState<{ isOpen: boolean; requestId: string } | null>(null);
    const [operators, setOperators] = useState<GetOperatorResponse[]>([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    const { connection } = useSignalR();

    useEffect(() => {
        const handleClickOutside = () => setActiveMenuRowId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

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
        return () => { connection.off("NewRequestCreated"); };
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

    useEffect(() => { fetchRequests(); }, [page, pageSize, activeTab]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearchParams({ page: '1' });
    };

    const handleAttachClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            localId: Math.random().toString(36).substring(7), file, isUploading: true
        }));
        setAttachedFiles(prev => [...prev, ...newAttachments]);

        newAttachments.forEach(async (att) => {
            try {
                const fileId = await fileService.upload(att.file);
                setAttachedFiles(prev => prev.map(p => p.localId === att.localId ? { ...p, id: fileId, isUploading: false } : p));
            } catch (error) {
                setAttachedFiles(prev => prev.map(p => p.localId === att.localId ? { ...p, isUploading: false, error: 'Ошибка' } : p));
                toast.error(`Не удалось загрузить ${att.file.name}`);
            }
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = async (localId: string) => {
        const fileToRemove = attachedFiles.find(f => f.localId === localId);
        setAttachedFiles(prev => prev.filter(f => f.localId !== localId));
        if (fileToRemove?.id && !fileToRemove.error) {
            try { await fileService.delete(fileToRemove.id); } catch (error) { console.error(error); }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (attachedFiles.some(f => f.isUploading)) {
            toast.error('Дождитесь окончания загрузки файлов');
            return;
        }
        setIsSubmitting(true);
        try {
            const attachmentIds = attachedFiles.filter(f => f.id && !f.error).map(f => f.id as string);
            const messageData: any = { text: formData.messageText };
            if (attachmentIds.length > 0) messageData.attachmentIds = attachmentIds;

            await requestService.create({ theme: formData.theme, priority: formData.priority, message: messageData });
            toast.success('Заявка успешно создана');
            setIsModalOpen(false);
            setFormData({ theme: '', priority: Priority.Normal, messageText: '' });
            setAttachedFiles([]);
            activeTab !== 'sent' ? handleTabChange('sent') : fetchRequests();
        } catch (error) {
            toast.error('Ошибка при создании заявки');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTakeInWork = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenuRowId(null);
        try {
            await requestService.takeInWork(id);
            toast.success('Заявка взята в работу');
            fetchRequests();
        } catch (error) {
            toast.error('Ошибка при назначении');
            fetchRequests();
        }
    };

    const handleTerminateSubmit = async (status: RequestStatus) => {
        if (!terminateModalParams) return;
        try {
            await requestService.terminate(terminateModalParams.requestId, status);
            toast.success('Статус успешно изменен');
            setTerminateModalParams(null);
            fetchRequests();
        } catch (e) {
            toast.error('Ошибка при смене статуса');
        }
    };

    // Открываем модалку и параллельно грузим список операторов (если еще не загрузили)
    const openAssignModal = async (requestId: string) => {
        setAssignModalParams({ isOpen: true, requestId });

        if (operators.length === 0) {
            try {
                const ops = await userService.getOperators();
                setOperators(ops);
                // По умолчанию выбираем первого в списке
                if (ops.length > 0) setSelectedOperatorId(ops[0].id);
            } catch (error) {
                toast.error('Не удалось загрузить список сотрудников');
            }
        } else {
            if (operators.length > 0) setSelectedOperatorId(operators[0].id);
        }
    };

// Отправляем запрос на назначение
    const handleAssignSubmit = async () => {
        if (!assignModalParams || !selectedOperatorId) return;
        setIsAssigning(true);

        try {
            await requestService.assignToOperator(assignModalParams.requestId, selectedOperatorId);
            toast.success('Оператор успешно назначен');
            setAssignModalParams(null);
            fetchRequests(); // Обновляем таблицу
        } catch (error) {
            toast.error('Ошибка при назначении оператора');
        } finally {
            setIsAssigning(false);
        }
    };

    const columns: ColumnDef<GetRequestResponse>[] = [
        { header: 'ТЕМА', renderCell: (item) => <div className="item-name text-truncate" title={item.theme}>{item.theme}</div> },
        { header: 'СОЗДАНА', renderCell: (item) => formatDate(item.createdAt) },
        { header: 'ПРИОРИТЕТ', renderCell: (item) => priorityOptions.find(p => p.value === item.priority)?.label || '-' },
        { header: 'СТАТУС', renderCell: (item) => <span className={`status-badge ${item.status === RequestStatus.New ? 'status-new' : 'status-in-progress'}`}>{statusLabels[item.status]}</span> },
        { header: 'УЧРЕЖДЕНИЕ', renderCell: (item) => <span className={item.institutionName ? '' : 'text-muted'}>{item.institutionName || '-'}</span> },
        { header: 'КЛИЕНТ', renderCell: (item) => item.clientFullName },
        {
            header: 'ОПЕРАТОР',
            renderCell: (item) => (
                <span className={item.operators && item.operators.length > 0 ? '' : 'text-muted'}>
            {item.operators && item.operators.length > 0
                ? item.operators.map(op => op.operatorFullName).join(', ')
                : 'Не назначен'}
        </span>
            )
        },
        { header: 'ЗАКРЫТА', renderCell: (item) => <span className={item.closedAt ? '' : 'text-muted'}>{formatDate(item.closedAt)}</span> },
        {
            header: '',
            width: 60,
            renderCell: (item) => {
                return (
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuRowId(activeMenuRowId === item.id ? null : item.id);
                            }}
                            style={{
                                background: 'transparent', border: 'none', fontSize: '20px',
                                cursor: 'pointer', padding: '0 8px', color: '#6c757d'
                            }}
                        >
                            ⋮
                        </button>

                        {activeMenuRowId === item.id && (
                            <div style={{
                                position: 'absolute', right: '0', top: '100%',
                                backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                                borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 50, display: 'flex', flexDirection: 'column',
                                minWidth: '200px', overflow: 'hidden'
                            }}>
                                <button className="rd-dropdown-item" onClick={() => navigate(`/requests/${item.id}`)}>
                                    Открыть заявку
                                </button>

                                {item.status === RequestStatus.New && hasTabs && (
                                    <button className="rd-dropdown-item" onClick={(e) => handleTakeInWork(item.id, e)}>
                                        Взять в работу
                                    </button>
                                )}

                                {hasTabs && (
                                    <button className="rd-dropdown-item" onClick={() => openAssignModal(item.id)}>
                                        Назначить оператора
                                    </button>
                                )}

                                {item.status !== RequestStatus.Closed && item.status !== RequestStatus.Canceled && (
                                    <button
                                        className="rd-dropdown-item text-danger"
                                        onClick={() => setTerminateModalParams({ isOpen: true, requestId: item.id, currentStatus: item.status })}
                                    >
                                        Закрыть / Отменить
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
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
                            <button className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`} onClick={() => handleTabChange('received')}>Полученные</button>
                            <button className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => handleTabChange('sent')}>Отправленные</button>
                        </div>
                    )
                }
            />

            <div className="data-card">
                <TableToolbar searchPlaceholder="Поиск заявок..." />
                <DataTable<GetRequestResponse> columns={columns} data={requests} isLoading={isLoading} onRowClick={(item) => navigate(`/requests/${item.id}`)} emptyMessage="Заявки не найдены" />
                <div className="pagination">
                    <button className="action-btn-secondary" disabled={!hasPrev} onClick={() => setSearchParams({ page: (page - 1).toString() })}>Назад</button>
                    <span className="pagination-info">Страница {page} из {totalPages === 0 ? 1 : totalPages}</span>
                    <button className="action-btn-secondary" disabled={!hasNext} onClick={() => setSearchParams({ page: (page + 1).toString() })}>Вперед</button>
                </div>
            </div>

            {/* Модалка создания заявки */}
            {isModalOpen && (
                <>
                    <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} />
                    <div className="modal-panel">
                        <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                        <form onSubmit={handleSave} className="modal-form">
                            <h3>Новая заявка</h3>
                            <div className="form-group">
                                <label>Тема *</label>
                                <input required value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} placeholder="Краткая суть проблемы" />
                            </div>
                            <div className="form-group">
                                <label>Приоритет *</label>
                                <select className="form-select" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})}>
                                    {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Описание проблемы *</label>
                                <textarea required value={formData.messageText} onChange={e => setFormData({...formData, messageText: e.target.value})} rows={5} placeholder="Опишите проблему максимально подробно..." />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
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
                                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                                <button type="button" className="action-btn-secondary" onClick={handleAttachClick} style={{width: 'fit-content'}}>📎 Прикрепить файлы</button>
                            </div>
                            <button type="submit" className="action-btn-primary modal-submit-btn" disabled={isSubmitting || attachedFiles.some(f => f.isUploading)}>
                                {isSubmitting ? 'Создание...' : 'Отправить заявку'}
                            </button>
                        </form>
                    </div>
                </>
            )}

            {/* Модалка закрытия/отмены из таблицы */}
            {terminateModalParams?.isOpen && (
                <>
                    <div className="modal-backdrop" onClick={() => setTerminateModalParams(null)} style={{ zIndex: 999 }} />
                    <div className="modal-panel" style={{ zIndex: 1000, maxWidth: '400px', margin: 'auto', top: '30%' }}>
                        <h3>Завершение заявки</h3>
                        <p>Выберите итоговый статус для заявки:</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="action-btn-primary" onClick={() => handleTerminateSubmit(RequestStatus.Closed)}>Закрыть (Решена)</button>
                            {hasTabs && (
                                <button className="action-btn-secondary" onClick={() => handleTerminateSubmit(RequestStatus.Canceled)} style={{ color: 'red' }}>Отменить (Ошибочная)</button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {assignModalParams?.isOpen && (
                <>
                    <div
                        onClick={() => setAssignModalParams(null)}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 999
                        }}
                    />
                    <div className="modal-panel" style={{ position: 'fixed', zIndex: 1000, maxWidth: '400px', width: '100%', margin: 'auto', left: 0, right: 0, top: '30%', backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}>
                        <button className="close-btn" onClick={() => setAssignModalParams(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
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
                            <button className="action-btn-secondary" onClick={() => setAssignModalParams(null)}>
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