import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
// Временный тип-заглушка, пока нет реального DTO с бэкенда
interface RequestStub {
    id: number;
    title: string;
    status: 'Новая' | 'В работе';
    creatorEmail: string;
    creatorRole: string;
    creatorInitials: string;
    createdAt: string;
}

export const RequestsPage = () => {
    // Временные данные (хардкод)
    const requestsData: RequestStub[] = [
        { id: 1, title: 'Ошибка при работе с данными', status: 'Новая', creatorEmail: 'ivanov@example.com', creatorRole: 'Пользователь', creatorInitials: 'И', createdAt: '25.03.2026 10:15' }
    ];

    const columns: ColumnDef<RequestStub>[] = [
        {
            header: <input type="checkbox" />,
            width: 40,
            renderCell: () => <input type="checkbox" />
        },
        {
            header: 'ТЕМА ЗАЯВКИ',
            renderCell: (item) => <span className="item-name">{item.title}</span>
        },
        {
            header: 'СТАТУС',
            renderCell: (item) => (
                <span className={`status-badge ${item.status === 'Новая' ? 'status-new' : 'status-in-progress'}`}>
                    {item.status}
                </span>
            )
        },
        {
            header: 'СОЗДАЛ',
            renderCell: (item) => (
                <div className="user-cell">
                    <div className="user-avatar">{item.creatorInitials}</div>
                    <div className="user-info">
                        <span className="user-email">{item.creatorEmail}</span>
                        <span className="user-role">{item.creatorRole}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'ДАТА СОЗДАНИЯ',
            key: 'createdAt'
        },
        {
            header: '',
            width: 50,
            renderCell: () => (
                <button className="more-btn">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                </button>
            )
        }
    ];

    return (
        <div className="content-body">
            <PageHeader
                title="Список заявок"
                actionLabel="Создать заявку"
                actionIcon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                }
                leftContent={
                    <div className="role-tabs">
                        <button className="tab-btn active">Полученные</button>
                        <button className="tab-btn">Отправленные</button>
                    </div>
                }
            />

            <div className="data-card">
                <TableToolbar
                    searchPlaceholder="Поиск заявок..."
                    filters={
                        <>
                            <button className="filter-btn">
                                Все типы
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            <button className="filter-btn">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                Фильтры
                            </button>
                        </>
                    }
                />

                <DataTable<RequestStub>
                    columns={columns}
                    data={requestsData}
                    isLoading={false}
                />
            </div>
        </div>
    );
};