import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import '../css/institution.css';
import '../css/requestDetails.css';

import { requestService } from '../services/request.service';
import { authService } from '../services/auth.service';
import { fileService } from '../services/file.service';
import { institutionService } from '../services/institution.service';
import { UserRole } from '../types/user.types';
import type { CreatePhoneRequestDto, CreateRequestFormState, GetRequestResponse, RequestActivityNotification } from '../types/request.types';
import { Priority, RequestStatus, RequestType } from '../types/request.types';
import { userService } from '../services/user.service';
import type { GetOperatorResponse, GetUserResponse } from '../types/user.types';
import type { InstitutionResponse } from '../types/institution.types';

import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { type ColumnDef, DataTable } from '../components/ui/DataTable';
import { useSignalR } from "../hooks/useSignalR";
import { getErrorMessage } from '../lib/errorHandler';

const priorityOptions = [
    { value: Priority.Normal, label: 'Обычный' },
    { value: Priority.High, label: 'Высокий' },
    { value: Priority.Emergency, label: 'Критический' }
];

const typeOptions = [
    { value: RequestType.System, label: 'Система' },
    { value: RequestType.Email, label: 'Электронная почта' },
    { value: RequestType.Phone, label: 'Телефон' }
];

const statusLabels: Record<RequestStatus, string> = {
    [RequestStatus.New]: 'Новая',
    [RequestStatus.InProgress]: 'В работе',
    [RequestStatus.ClientDataRequest]: 'Запрос данных',
    [RequestStatus.PendingReview]: 'Приемка',
    [RequestStatus.Closed]: 'Закрыта',
    [RequestStatus.Canceled]: 'Отменена',
    [RequestStatus.Analysis]: 'Анализ',
    [RequestStatus.Merged]: 'Объединена',
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
    const requiresInstitution = currentUser?.role === UserRole.User || currentUser?.role === UserRole.UserAdmin;

    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const [activeTab, setActiveTab] = useState<TabType>(hasTabs ? 'received' : 'sent');
    const [requests, setRequests] = useState<GetRequestResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    const [availableInstitutions, setAvailableInstitutions] = useState<InstitutionResponse[]>([]);
    const [institutionsLoading, setInstitutionsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<CreateRequestFormState>({
        theme: '', priority: Priority.Normal, type: RequestType.System, messageText: '', institutionId: null
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<{ localId: string; file: File; id?: string; isUploading: boolean; error?: string; }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedRequests, setSelectedRequests] = useState<Record<string, Pick<GetRequestResponse, 'id' | 'theme' | 'clientId'>>>({});
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [mergeParentId, setMergeParentId] = useState('');
    const [isMerging, setIsMerging] = useState(false);

    const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
    const [clients, setClients] = useState<GetUserResponse[]>([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [phoneForm, setPhoneForm] = useState<CreatePhoneRequestDto>({
        clientId: '', theme: '', priority: Priority.Normal, institutionId: null, message: { text: '' }
    });
    const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);

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
        const loadInstitutions = async () => {
            try {
                if (hasTabs) {
                    const institutions: InstitutionResponse[] = [];
                    let page = 1;
                    let hasNext = true;
                    while (hasNext) {
                        const result = await institutionService.getAll({ page, pageSize: 50 });
                        institutions.push(...result.items);
                        hasNext = result.pageInfo.hasNextPage;
                        page++;
                    }
                    setAvailableInstitutions(institutions);
                } else {
                    setAvailableInstitutions(await institutionService.getMy());
                }
            } catch (error) {
                setAvailableInstitutions([]);
                if (requiresInstitution) {
                    toast.error(getErrorMessage(error, 'Не удалось загрузить ваши учреждения'));
                }
            } finally {
                setInstitutionsLoading(false);
            }
        };
        void loadInstitutions();
    }, [hasTabs, requiresInstitution]);

    useEffect(() => {
        if (!connection) return;
        connection.on("NewRequestCreated", (newRequest: GetRequestResponse) => {
            if (activeTab === 'received') {
                void fetchRequests();
                toast('Поступила новая заявка!', { icon: '🔔' });
            }
        });
        const handleRequestMerged = () => { void fetchRequests(); };
        connection.on('RequestMerged', handleRequestMerged);
        const handleRequestActivity = (activity: RequestActivityNotification) => {
            if (activity.senderId !== currentUser?.id) void fetchRequests();
        };
        connection.on('RequestActivity', handleRequestActivity);
        return () => {
            connection.off("NewRequestCreated");
            connection.off('RequestMerged', handleRequestMerged);
            connection.off('RequestActivity', handleRequestActivity);
        };
    }, [connection, activeTab, currentUser?.id]);

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
            toast.error(getErrorMessage(error, 'Ошибка загрузки заявок'));
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

    const openCreateModal = () => {
        const defaultInstitutionId = requiresInstitution && availableInstitutions.length === 1
            ? availableInstitutions[0]?.id ?? null
            : null;
        setFormData({ theme: '', priority: Priority.Normal, type: RequestType.System, messageText: '', institutionId: defaultInstitutionId });
        setAttachedFiles([]);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (attachedFiles.some(f => f.isUploading)) {
            toast.error('Дождитесь окончания загрузки файлов');
            return;
        }
        if (requiresInstitution && !formData.institutionId) {
            toast.error('Выберите учреждение');
            return;
        }
        setIsSubmitting(true);
        try {
            const attachmentIds = attachedFiles.filter(f => f.id && !f.error).map(f => f.id as string);
            const messageData: { text: string; attachmentIds?: string[] } = { text: formData.messageText };
            if (attachmentIds.length > 0) messageData.attachmentIds = attachmentIds;

            await requestService.create({
                theme: formData.theme,
                priority: formData.priority,
                type: formData.type,
                message: messageData,
                institutionId: formData.institutionId || null
            });
            toast.success('Заявка успешно создана');
            setIsModalOpen(false);
            setFormData({ theme: '', priority: Priority.Normal, type: RequestType.System, messageText: '', institutionId: null });
            setAttachedFiles([]);
            activeTab !== 'sent' ? handleTabChange('sent') : fetchRequests();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при создании заявки'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTakeInWork = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenuRowId(null);

        if (!currentUser?.id) return;

        try {
            await requestService.assignToOperator(id, currentUser.id);

            toast.success('Заявка взята в работу');
            fetchRequests();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при назначении'));
            fetchRequests();
        }
    };

    const handleTerminateSubmit = async (status: RequestStatus) => {
        if (!terminateModalParams) return;
        try {
            await requestService.changeStatus(terminateModalParams.requestId, status);
            toast.success('Статус успешно изменен');
            setTerminateModalParams(null);
            fetchRequests();
        } catch (e) {
            toast.error(getErrorMessage(e, 'Ошибка при смене статуса'));
        }
    };

    const openAssignModal = async (requestId: string) => {
        setAssignModalParams({ isOpen: true, requestId });

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
        if (!assignModalParams || !selectedOperatorId) return;
        setIsAssigning(true);

        try {
            await requestService.assignToOperator(assignModalParams.requestId, selectedOperatorId);
            toast.success('Оператор успешно назначен');
            setAssignModalParams(null);
            fetchRequests();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при назначении оператора'));
        } finally {
            setIsAssigning(false);
        }
    };

    const toggleRequestSelection = (request: GetRequestResponse) => {
        setSelectedRequests(previous => {
            const next = { ...previous };
            if (next[request.id]) delete next[request.id];
            else next[request.id] = { id: request.id, theme: request.theme, clientId: request.clientId };
            return next;
        });
    };

    const openMergeModal = () => {
        const selected = Object.values(selectedRequests);
        if (selected.length < 2) {
            toast.error('Выберите не менее двух заявок');
            return;
        }
        if (new Set(selected.map(item => item.clientId)).size > 1) {
            toast.error('Можно объединять только заявки одного клиента');
            return;
        }
        setMergeParentId(selected[0]?.id ?? '');
        setIsMergeModalOpen(true);
    };

    const handleMerge = async () => {
        const duplicateRequestIds = Object.keys(selectedRequests).filter(requestId => requestId !== mergeParentId);
        if (!mergeParentId || duplicateRequestIds.length === 0) return;
        setIsMerging(true);
        try {
            const parent = await requestService.merge(mergeParentId, { duplicateRequestIds });
            setSelectedRequests({});
            setIsMergeModalOpen(false);
            toast.success('Заявки объединены');
            navigate(`/requests/${parent.id}`);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось объединить заявки'));
        } finally {
            setIsMerging(false);
        }
    };

    const openPhoneModal = async () => {
        setPhoneForm({ clientId: '', theme: '', priority: Priority.Normal, institutionId: null, message: { text: '' } });
        setIsPhoneModalOpen(true);
        if (clients.length > 0) return;

        setClientsLoading(true);
        try {
            const loaded: GetUserResponse[] = [];
            let pageNumber = 1;
            let totalPages = 1;
            while (pageNumber <= totalPages) {
                const result = await userService.getAll({ page: pageNumber, pageSize: 50 });
                loaded.push(...result.items);
                totalPages = result.pageInfo.totalPages;
                pageNumber++;
            }
            setClients(loaded.filter(client => client.isActivated &&
                (client.role === UserRole.User || client.role === UserRole.UserAdmin)));
        } catch (error) {
            setIsPhoneModalOpen(false);
            toast.error(getErrorMessage(error, 'Не удалось загрузить клиентов'));
        } finally {
            setClientsLoading(false);
        }
    };

    const handlePhoneClientChange = (clientId: string) => {
        const client = clients.find(item => item.id === clientId);
        const institutionId = client?.workplaces.length === 1 ? client.workplaces[0]?.institutionId ?? null : null;
        setPhoneForm(previous => ({ ...previous, clientId, institutionId }));
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPhoneSubmitting(true);
        try {
            await requestService.createPhone(phoneForm);
            setIsPhoneModalOpen(false);
            toast.success('Заявка по звонку создана');
            setActiveTab('received');
            setSearchParams({ page: '1' });
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось создать заявку по звонку'));
        } finally {
            setIsPhoneSubmitting(false);
        }
    };

    const columns: ColumnDef<GetRequestResponse>[] = [
        { header: 'ТЕМА', renderCell: (item) => <div className={`item-name text-truncate ${item.isUnread ? 'request-unread' : ''}`} title={item.theme}>{item.theme}</div> },
        { header: 'СОЗДАНА', renderCell: (item) => formatDate(item.createdAt) },
        { header: 'ПРИОРИТЕТ', renderCell: (item) => priorityOptions.find(p => p.value === item.priority)?.label || '-' },
        { header: 'ТИП', renderCell: (item) => typeOptions.find(type => type.value === item.type)?.label || '-' },
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

    if (hasTabs && activeTab === 'received') {
        columns.unshift({
            header: 'ВЫБРАТЬ',
            width: 64,
            renderCell: item => (
                <input
                    type="checkbox"
                    className="request-merge-checkbox"
                    aria-label={`Выбрать заявку ${item.theme} для объединения`}
                    checked={Boolean(selectedRequests[item.id])}
                    onClick={event => event.stopPropagation()}
                    onChange={() => toggleRequestSelection(item)}
                />
            )
        });
    }

    return (
        <div className="content-body">
            <PageHeader
                title="Список заявок"
                actionLabel="Создать заявку"
                onAction={openCreateModal}
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
                extraActions={hasTabs && <>
                    {activeTab === 'received' && <button className="action-btn-secondary" onClick={openMergeModal} disabled={Object.keys(selectedRequests).length < 2}>
                        Объединить ({Object.keys(selectedRequests).length})
                    </button>}
                    <button className="action-btn-secondary" onClick={() => void openPhoneModal()}>
                        Заявка по звонку
                    </button>
                </>}
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
                                <label>Тип заявки *</label>
                                <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as RequestType})}>
                                    {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Учреждение {requiresInstitution ? '*' : ''}</label>
                                <select
                                    className="form-select"
                                    required={requiresInstitution}
                                    disabled={institutionsLoading}
                                    value={formData.institutionId || ''}
                                    onChange={e => setFormData({ ...formData, institutionId: e.target.value || null })}
                                >
                                    <option value="">{institutionsLoading ? 'Загрузка учреждений...' : requiresInstitution ? '-- Выберите учреждение --' : '-- Без учреждения --'}</option>
                                    {availableInstitutions.map(inst => (
                                        <option key={inst.id} value={inst.id}>
                                            {inst.name} (ИНН: {inst.inn})
                                        </option>
                                    ))}
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

            {isPhoneModalOpen && (
                <>
                    <div className="modal-backdrop" onClick={() => !isPhoneSubmitting && setIsPhoneModalOpen(false)} />
                    <div className="modal-panel">
                        <button className="close-btn" disabled={isPhoneSubmitting} onClick={() => setIsPhoneModalOpen(false)}>✕</button>
                        <form onSubmit={handlePhoneSubmit} className="modal-form">
                            <h3>Заявка по звонку</h3>
                            <div className="form-group">
                                <label>Клиент *</label>
                                <select className="form-select" required disabled={clientsLoading} value={phoneForm.clientId}
                                    onChange={event => handlePhoneClientChange(event.target.value)}>
                                    <option value="">{clientsLoading ? 'Загрузка клиентов...' : clients.length === 0 ? 'Активные клиенты не найдены' : '-- Выберите клиента --'}</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {[client.surname, client.name, client.patronymic].filter(Boolean).join(' ') || client.email} — {client.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Учреждение</label>
                                <select className="form-select" disabled={!phoneForm.clientId}
                                    value={phoneForm.institutionId || ''}
                                    onChange={event => setPhoneForm(previous => ({ ...previous, institutionId: event.target.value || null }))}>
                                    <option value="">-- Без учреждения --</option>
                                    {clients.find(client => client.id === phoneForm.clientId)?.workplaces.map(workplace => (
                                        <option key={workplace.institutionId} value={workplace.institutionId}>{workplace.institutionName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Тема *</label>
                                <input required value={phoneForm.theme} onChange={event => setPhoneForm(previous => ({ ...previous, theme: event.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Приоритет *</label>
                                <select className="form-select" value={phoneForm.priority}
                                    onChange={event => setPhoneForm(previous => ({ ...previous, priority: event.target.value as Priority }))}>
                                    {priorityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Содержание звонка *</label>
                                <textarea required rows={5} value={phoneForm.message.text}
                                    onChange={event => setPhoneForm(previous => ({ ...previous, message: { text: event.target.value } }))} />
                            </div>
                            <button type="submit" className="action-btn-primary modal-submit-btn"
                                disabled={isPhoneSubmitting || clientsLoading || clients.length === 0}>
                                {isPhoneSubmitting ? 'Создание...' : 'Создать заявку'}
                            </button>
                        </form>
                    </div>
                </>
            )}

            {isMergeModalOpen && (
                <>
                    <div className="modal-backdrop" onClick={() => !isMerging && setIsMergeModalOpen(false)} />
                    <div className="modal-panel">
                        <button className="close-btn" disabled={isMerging} onClick={() => setIsMergeModalOpen(false)}>✕</button>
                        <div className="modal-form">
                            <h3>Объединение заявок</h3>
                            <p>Выберите родительскую заявку. Сообщения и операторы остальных заявок будут перенесены в неё.</p>
                            <div className="form-group">
                                <label>Родительская заявка *</label>
                                <select className="form-select" value={mergeParentId} onChange={event => setMergeParentId(event.target.value)}>
                                    {Object.values(selectedRequests).map(selected => (
                                        <option key={selected.id} value={selected.id}>{selected.theme} ({selected.id.slice(0, 8)})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Будут объединены</label>
                                <ul>{Object.values(selectedRequests).filter(item => item.id !== mergeParentId)
                                    .map(item => <li key={item.id}>{item.theme} ({item.id.slice(0, 8)})</li>)}</ul>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button className="action-btn-secondary" disabled={isMerging} onClick={() => setIsMergeModalOpen(false)}>Отмена</button>
                                <button className="action-btn-primary" disabled={isMerging || Object.keys(selectedRequests).length < 2} onClick={() => void handleMerge()}>
                                    {isMerging ? 'Объединение...' : 'Объединить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

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
