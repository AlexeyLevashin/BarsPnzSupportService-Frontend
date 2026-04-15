import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import { requestService } from '../services/request.service';
import { authService } from '../services/auth.service';
import { UserRole } from '../types/user.types';
import { Priority, RequestStatus } from '../types/request.types';
import type { GetRequestResponse, CreateRequestFormState } from '../types/request.types';

import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';

const priorityOptions = [
    { value: Priority.Normal, label: 'Обычный' },
    { value: Priority.High, label: 'Высокий' },
    { value: Priority.Emergency, label: 'Критический' }
];

const statusLabels: Record<RequestStatus, string> = {
    [RequestStatus.New]: 'Новая',
    [RequestStatus.InProgress]: 'В работе',
    [RequestStatus.ClientDataRequest]: 'Запрос данных',
    [RequestStatus.PendingReview]: 'Ожидает проверки',
    [RequestStatus.Closed]: 'Закрыта',
    [RequestStatus.Canceled]: 'Отменена'
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await requestService.create(formData);
            toast.success('Заявка успешно создана');
            setIsModalOpen(false);
            setFormData({ theme: '', priority: Priority.Normal, messageText: '' });

            if (activeTab !== 'sent') {
                handleTabChange('sent');
            } else {
                fetchRequests();
            }
        } catch (error) {
            toast.error('Ошибка при создании заявки');
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
        {
            header: 'ТЕМА',
            renderCell: (item) => <span className="item-name" style={{ fontWeight: 500 }}>{item.theme}</span>
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
            renderCell: (item) => <span style={{ color: item.institutionName ? 'inherit' : 'var(--text-muted)' }}>{item.institutionName || '-'}</span>
        },
        {
            header: 'КЛИЕНТ',
            renderCell: (item) => item.clientFullName
        },
        {
            header: 'ОПЕРАТОР',
            renderCell: (item) => <span style={{ color: item.operatorFullName ? 'inherit' : 'var(--text-muted)' }}>{item.operatorFullName || '-'}</span>
        },
        {
            header: 'ЗАКРЫТА',
            renderCell: (item) => <span style={{ color: item.closedAt ? 'inherit' : 'var(--text-muted)' }}>{formatDate(item.closedAt)}</span>
        },
        {
            header: '',
            width: 140,
            renderCell: (item) => {
                if (item.status === RequestStatus.New && activeTab === 'received') {
                    return (
                        <button
                            className="action-btn-primary"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
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
                        <div className="role-tabs" style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                            <button
                                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'received' ? '#fff' : 'transparent', boxShadow: activeTab === 'received' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontWeight: 500, color: activeTab === 'received' ? '#0f172a' : '#64748b' }}
                                onClick={() => handleTabChange('received')}
                            >
                                Полученные
                            </button>
                            <button
                                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'sent' ? '#fff' : 'transparent', boxShadow: activeTab === 'sent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontWeight: 500, color: activeTab === 'sent' ? '#0f172a' : '#64748b' }}
                                onClick={() => handleTabChange('sent')}
                            >
                                Отправленные
                            </button>
                        </div>
                    )
                }
            />

            <div className="data-card">
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
                    <span style={{ margin: '0 16px', display: 'flex', alignItems: 'center' }}>
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
                                    onChange={e => setFormData({...formData, priority: Number(e.target.value)})}
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
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                                    placeholder="Опишите проблему максимально подробно..."
                                />
                            </div>

                            <button type="submit" className="action-btn-primary" style={{marginTop: '16px', width: '100%', justifyContent: 'center'}}>
                                Отправить заявку
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};