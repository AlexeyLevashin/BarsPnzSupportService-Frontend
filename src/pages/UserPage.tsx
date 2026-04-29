import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import '../css/institution.css';

import { userService } from '../services/user.service';
import { institutionService } from '../services/institution.service';
import { UserRole } from '../types/user.types';
import type { GetUserResponse, CreateUserByAdminRequest } from '../types/user.types';
import type { InstitutionResponse } from '../types/institution.types';

import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
import { authService } from "../services/auth.service";

const roleOptions = [
    { value: UserRole.User, label: 'Пользователь' },
    { value: UserRole.Operator, label: 'Оператор' },
    { value: UserRole.UserAdmin, label: 'Админ учреждения' },
    { value: UserRole.SuperAdmin, label: 'Супер-админ' }
];

export const UsersPage = () => {
    const currentUser = authService.getCurrentUser();

    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const [users, setUsers] = useState<GetUserResponse[]>([]);
    const [institutionsList, setInstitutionsList] = useState<InstitutionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [totalPages, setTotalPages] = useState(1);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    const [modalMode, setModalMode] = useState<'none' | 'details' | 'form' | 'delete' | 'password'>('none');
    const [selectedUser, setSelectedUser] = useState<GetUserResponse | null>(null);

    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);

    const initialFormState: CreateUserByAdminRequest = {
        name: '', surname: '', patronymic: '', email: '', role: UserRole.User, institutionId: null
    };
    const [formData, setFormData] = useState<CreateUserByAdminRequest>(initialFormState);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await userService.getAll({ page, pageSize });
            setUsers(res.items);
            setTotalPages(res.pageInfo.totalPages);
            setHasPrev(res.pageInfo.hasPreviousPage);
            setHasNext(res.pageInfo.hasNextPage);
        } catch (error) {
            toast.error('Ошибка загрузки пользователей');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInstitutionsForDictionary = async () => {
        try {
            const currentUser = authService.getCurrentUser();

            if (currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Operator) {
                const res = await institutionService.getAll({ page: 1, pageSize: 1000 });
                setInstitutionsList(res.items);
            }
            else if (currentUser?.role === UserRole.UserAdmin) {
                const myInst = await institutionService.getMy();
                setInstitutionsList([myInst]);
            }
        } catch (error) {
            console.error("Ошибка загрузки справочника:", error);
        }
    };

    useEffect(() => {
        fetchInstitutionsForDictionary();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page, pageSize]);

    const handleRowClick = (user: GetUserResponse) => {
        setSelectedUser(user);
        setModalMode('details');
    };

    const handleCreateClick = () => {
        setSelectedUser(null);
        setFormData({
            ...initialFormState,
            role: UserRole.User,
            institutionId: (currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Operator)
                ? null
                : currentUser?.institutionId || null
        });
        setModalMode('form');
    };

    const handleEditClick = () => {
        if (selectedUser) {
            setFormData({
                name: selectedUser.name,
                surname: selectedUser.surname,
                patronymic: selectedUser.patronymic ?? null,
                email: selectedUser.email,
                role: selectedUser.role,
                institutionId: selectedUser.institutionId ?? null
            });
            setModalMode('form');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await userService.update(selectedUser.id, formData);
                toast.success('Пользователь успешно обновлен');
                setModalMode('none');
                fetchUsers();
            } else {
                const newUser = await userService.create(formData);
                setCreatedCredentials({ email: newUser.email, password: newUser.initialPassword });
                setModalMode('password');
                fetchUsers();
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Ошибка при сохранении пользователя');
            }
        }
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;
        try {
            await userService.delete(selectedUser.id);
            toast.success('Пользователь удален');
            setModalMode('none');
            fetchUsers();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Ошибка удаления');
            }
        }
    };

    const columns: ColumnDef<GetUserResponse>[] = [
        {
            header: 'ФИО',
            renderCell: (u) => `${u.surname} ${u.name} ${u.patronymic || ''}`.trim()
        },
        { header: 'Email', key: 'email' },
        {
            header: 'Роль',
            renderCell: (u) => roleOptions.find(r => r.value === u.role)?.label || 'Неизвестно'
        },
        {
            header: 'Учреждение',
            renderCell: (u) => {
                if (!u.institutionId) return <span className="text-muted">-</span>;
                const inst = institutionsList.find(i => i.id === u.institutionId);
                return inst ? inst.name : 'Загрузка...';
            }
        }
    ];

    const availableRoleOptions = roleOptions.filter(opt => {
        if (currentUser?.role === UserRole.SuperAdmin) return true;

        if (currentUser?.role === UserRole.Operator) {
            return opt.value === UserRole.User || opt.value === UserRole.UserAdmin;
        }

        if (currentUser?.role === UserRole.UserAdmin) {
            return opt.value === UserRole.User;
        }

        return opt.value === UserRole.User;
    });

    return (
        <div className="content-body">
            <PageHeader
                title="Пользователи"
                actionLabel="Добавить пользователя"
                onAction={handleCreateClick}
            />

            <div className="data-card">
                <TableToolbar searchPlaceholder="Поиск пользователей..." />

                <DataTable<GetUserResponse>
                    columns={columns}
                    data={users}
                    isLoading={isLoading}
                    onRowClick={handleRowClick}
                    emptyMessage="Пользователи не найдены"
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

            {modalMode !== 'none' && (
                <>
                    <div className="modal-backdrop" onClick={() => setModalMode('none')} />
                    <div className="modal-panel">
                        <button className="close-btn" onClick={() => setModalMode('none')}>✕</button>

                        {modalMode === 'details' && selectedUser && (
                            <div className="modal-details">
                                <h3>{selectedUser.surname} {selectedUser.name}</h3>
                                <p><strong>Email:</strong> {selectedUser.email}</p>
                                <p><strong>Роль:</strong> {roleOptions.find(r => r.value === selectedUser.role)?.label}</p>
                                {selectedUser.institutionId && (
                                    <p><strong>Учреждение:</strong> {institutionsList.find(i => i.id === selectedUser.institutionId)?.name}</p>
                                )}

                                <div className="modal-actions">
                                    <button className="action-btn-secondary" onClick={handleEditClick}>Редактировать</button>
                                    <button className="action-btn-danger" onClick={() => setModalMode('delete')}>Удалить</button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'delete' && selectedUser && (
                            <div className="modal-details">
                                <h3 className="modal-header-danger">Удаление пользователя</h3>
                                <p>Вы действительно хотите удалить <strong>{selectedUser.email}</strong>?</p>
                                <div className="modal-actions">
                                    <button className="action-btn-danger" onClick={confirmDelete}>Да, удалить</button>
                                    <button className="action-btn-secondary" onClick={() => setModalMode('details')}>Отмена</button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'password' && createdCredentials && (
                            <div className="modal-details">
                                <h3 className="modal-header-success">Пользователь успешно создан!</h3>
                                <p>Обязательно сохраните временный пароль. <strong>Он больше нигде не будет показан.</strong></p>

                                <div className="password-box">
                                    <p><strong>Email (Логин):</strong> {createdCredentials.email}</p>
                                    <p className="password-row">
                                        <strong>Пароль:</strong>
                                        <span className="password-highlight">
                                            {createdCredentials.password}
                                        </span>
                                    </p>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        className="action-btn-primary"
                                        onClick={() => {
                                            if (!createdCredentials) return;
                                            navigator.clipboard.writeText(`Логин: ${createdCredentials.email}\nПароль: ${createdCredentials.password}`);
                                            toast.success('Данные скопированы в буфер обмена!');
                                        }}
                                    >
                                        <svg className="btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        Скопировать
                                    </button>
                                    <button className="action-btn-secondary" onClick={() => setModalMode('none')}>
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'form' && (
                            <form onSubmit={handleSave} className="modal-form">
                                <h3>{selectedUser ? 'Редактирование' : 'Новый пользователь'}</h3>

                                <div className="form-group">
                                    <label>Фамилия *</label>
                                    <input required value={formData.surname}
                                           onChange={e => setFormData({...formData, surname: e.target.value})}/>
                                </div>
                                <div className="form-group">
                                    <label>Имя *</label>
                                    <input required value={formData.name}
                                           onChange={e => setFormData({...formData, name: e.target.value})}/>
                                </div>
                                <div className="form-group">
                                    <label>Отчество</label>
                                    <input value={formData.patronymic || ''}
                                           onChange={e => setFormData({...formData, patronymic: e.target.value})}/>
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input required type="email" value={formData.email}
                                           onChange={e => setFormData({...formData, email: e.target.value})}/>
                                </div>

                                <div className="form-group">
                                    <label>Роль *</label>
                                    <select
                                        className="form-select"
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                        disabled={availableRoleOptions.length === 1}
                                    >
                                        {availableRoleOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Учреждение</label>
                                    <select
                                        className="form-select"
                                        value={formData.institutionId || ''}
                                        onChange={e => setFormData({
                                            ...formData,
                                            institutionId: e.target.value || null
                                        })}
                                        disabled={currentUser?.role !== UserRole.SuperAdmin && currentUser?.role !== UserRole.Operator}
                                    >
                                        <option value="">-- Без учреждения --</option>
                                        {institutionsList.map(inst => (
                                            <option key={inst.id} value={inst.id}>
                                                {inst.name} (ИНН: {inst.inn})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button type="submit" className="action-btn-primary modal-submit-btn">
                                    Сохранить
                                </button>
                            </form>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};