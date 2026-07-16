import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import '../css/institution.css';

import { userService } from '../services/user.service';
import { employeeService } from '../services/employee.service';
import { institutionService } from '../services/institution.service';
import { UserRole } from '../types/user.types';
import type { GetUserResponse, CreateUserByAdminRequest, WorkplaceRequest } from '../types/user.types';
import type { GetEmployeeResponse } from '../types/employee.types';
import type { InstitutionResponse } from '../types/institution.types';

import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
import { authService } from "../services/auth.service";
import { getErrorMessage } from '../lib/errorHandler';

const roleOptions = [
    { value: UserRole.User, label: 'Пользователь' },
    { value: UserRole.Operator, label: 'Оператор' },
    { value: UserRole.UserAdmin, label: 'Админ учреждения' },
    { value: UserRole.SuperAdmin, label: 'Супер-админ' }
];

type TabType = 'employees' | 'users';
type FormKind = 'create' | 'edit-employee' | 'edit-user';

interface PersonFormState {
    name: string;
    surname: string;
    patronymic: string | null;
    phoneNumber: string | null;
    email: string;
    makeUser: boolean;
    role: UserRole;
    workplaces: WorkplaceRequest[];
}

const emptyForm: PersonFormState = {
    name: '',
    surname: '',
    patronymic: null,
    phoneNumber: null,
    email: '',
    makeUser: false,
    role: UserRole.User,
    workplaces: []
};

export const UsersPage = () => {
    const currentUser = authService.getCurrentUser();
    const isStaff = currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Operator;
    const isUserAdmin = currentUser?.role === UserRole.UserAdmin;
    const roleRequiresWorkplace = (role: UserRole) => role === UserRole.User || role === UserRole.UserAdmin;

    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const [activeTab, setActiveTab] = useState<TabType>('employees');
    const [employees, setEmployees] = useState<GetEmployeeResponse[]>([]);
    const [users, setUsers] = useState<GetUserResponse[]>([]);
    const [institutionsList, setInstitutionsList] = useState<InstitutionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [totalPages, setTotalPages] = useState(1);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    const [modalMode, setModalMode] = useState<'none' | 'details' | 'form' | 'account' | 'delete' | 'password'>('none');
    const [formKind, setFormKind] = useState<FormKind>('create');
    const [selectedEmployee, setSelectedEmployee] = useState<GetEmployeeResponse | null>(null);
    const [selectedUser, setSelectedUser] = useState<GetUserResponse | null>(null);

    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);

    const [formData, setFormData] = useState<PersonFormState>({ ...emptyForm });
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');

    // Форма создания учетной записи для существующего сотрудника
    const [accountForm, setAccountForm] = useState<CreateUserByAdminRequest>({ email: '', role: UserRole.User });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'employees') {
                const res = await employeeService.getAll({ page, pageSize });
                setEmployees(res.items);
                setTotalPages(res.pageInfo.totalPages);
                setHasPrev(res.pageInfo.hasPreviousPage);
                setHasNext(res.pageInfo.hasNextPage);
            } else {
                const res = await userService.getAll({ page, pageSize });
                setUsers(res.items);
                setTotalPages(res.pageInfo.totalPages);
                setHasPrev(res.pageInfo.hasPreviousPage);
                setHasNext(res.pageInfo.hasNextPage);
            }
        } catch (error) {
            toast.error(getErrorMessage(error, activeTab === 'employees' ? 'Ошибка загрузки сотрудников' : 'Ошибка загрузки пользователей'));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInstitutionsForDictionary = async () => {
        try {
            if (isStaff) {
                const res = await institutionService.getAll({ page: 1, pageSize: 1000 });
                setInstitutionsList(res.items);
            } else if (isUserAdmin) {
                const myInst = await institutionService.getMy();
                setInstitutionsList(myInst);
            }
        } catch (error) {
            console.error("Ошибка загрузки справочника:", getErrorMessage(error));
        }
    };

    useEffect(() => {
        fetchInstitutionsForDictionary();
    }, []);

    useEffect(() => {
        fetchData();
    }, [page, pageSize, activeTab]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearchParams({ page: '1' });
    };

    const closeModal = () => {
        setModalMode('none');
        setFormKind('create');
        setSelectedEmployee(null);
        setSelectedUser(null);
    };

    const handleEmployeeRowClick = async (employee: GetEmployeeResponse) => {
        // Сотрудник с учёткой → всегда ищем пользователя по employeeId,
        // а не через userId из списка (там мог оказаться id сотрудника → 404)
        if (employee.isUser) {
            try {
                const user = await userService.getByEmployeeId(employee.id);
                setSelectedUser(user);
                setSelectedEmployee(null);
                setModalMode('details');
            } catch (error) {
                toast.error(getErrorMessage(error, 'Не удалось загрузить данные пользователя'));
            }
            return;
        }

        setSelectedEmployee(employee);
        setSelectedUser(null);
        setModalMode('details');
    };

    const handleUserRowClick = (user: GetUserResponse) => {
        setSelectedUser(user);
        setSelectedEmployee(null);
        setModalMode('details');
    };

    const handleCreateClick = () => {
        setSelectedEmployee(null);
        setSelectedUser(null);
        const defaultWorkplaces: WorkplaceRequest[] = isUserAdmin && institutionsList.length > 0
            ? institutionsList.map(i => ({ institutionId: i.id, jobTitleId: null }))
            : [];
        setFormData({ ...emptyForm, workplaces: defaultWorkplaces });
        setSelectedInstitutionId('');
        setFormKind('create');
        setModalMode('form');
    };

    const handleEditClick = () => {
        if (selectedUser) {
            setFormData({
                name: selectedUser.name,
                surname: selectedUser.surname,
                patronymic: selectedUser.patronymic ?? null,
                phoneNumber: selectedUser.phoneNumber ?? null,
                email: selectedUser.email,
                makeUser: false,
                role: selectedUser.role,
                workplaces: selectedUser.workplaces.map(w => ({
                    institutionId: w.institutionId,
                    jobTitleId: w.jobTitleId ?? null
                }))
            });
            setFormKind('edit-user');
        } else if (selectedEmployee) {
            setFormData({
                name: selectedEmployee.name,
                surname: selectedEmployee.surname,
                patronymic: selectedEmployee.patronymic ?? null,
                phoneNumber: selectedEmployee.phoneNumber ?? null,
                email: selectedEmployee.email ?? '',
                makeUser: false,
                role: UserRole.User,
                workplaces: selectedEmployee.workplaces.map(w => ({
                    institutionId: w.institutionId,
                    jobTitleId: w.jobTitleId ?? null
                }))
            });
            setFormKind('edit-employee');
        }
        setSelectedInstitutionId('');
        setModalMode('form');
    };

    const handleCreateAccountClick = () => {
        if (!selectedEmployee) return;
        setAccountForm({ email: selectedEmployee.email || '', role: UserRole.User });
        setModalMode('account');
    };

    const addWorkplace = () => {
        if (!selectedInstitutionId) return;
        if (formData.workplaces.some(w => w.institutionId === selectedInstitutionId)) {
            toast.error('Это учреждение уже добавлено');
            return;
        }
        setFormData({
            ...formData,
            workplaces: [...formData.workplaces, { institutionId: selectedInstitutionId, jobTitleId: null }]
        });
        setSelectedInstitutionId('');
    };

    const removeWorkplace = (institutionId: string) => {
        setFormData({
            ...formData,
            workplaces: formData.workplaces.filter(w => w.institutionId !== institutionId)
        });
    };

    const getInstitutionName = (institutionId: string) => {
        const fromList = institutionsList.find(i => i.id === institutionId);
        if (fromList) return fromList.name;
        const fromSelected = (selectedEmployee?.workplaces || selectedUser?.workplaces)?.find(w => w.institutionId === institutionId);
        return fromSelected?.institutionName || institutionId;
    };

    const isUserForm = formKind === 'edit-user' || (formKind === 'create' && formData.makeUser);
    const emailRequired = isUserForm;
    const showRoleField = isUserForm;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isUserForm && roleRequiresWorkplace(formData.role) && formData.workplaces.length === 0) {
            toast.error('Для этой роли необходимо указать хотя бы одно учреждение');
            return;
        }

        try {
            if (formKind === 'edit-user' && selectedUser) {
                await userService.update(selectedUser.id, {
                    name: formData.name,
                    surname: formData.surname,
                    patronymic: formData.patronymic,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email,
                    role: formData.role,
                    workplaces: formData.workplaces
                });
                toast.success('Пользователь успешно обновлен');
                closeModal();
                fetchData();
            } else if (formKind === 'edit-employee' && selectedEmployee) {
                await employeeService.update(selectedEmployee.id, {
                    name: formData.name,
                    surname: formData.surname,
                    patronymic: formData.patronymic,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email || null,
                    workplaces: formData.workplaces
                });
                toast.success('Сотрудник успешно обновлен');
                closeModal();
                fetchData();
            } else if (formKind === 'create' && formData.makeUser) {
                const newUser = await userService.createWithEmployee({
                    name: formData.name,
                    surname: formData.surname,
                    patronymic: formData.patronymic,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email,
                    role: formData.role,
                    workplaces: formData.workplaces
                });
                setCreatedCredentials({ email: newUser.email, password: newUser.initialPassword });
                setModalMode('password');
                fetchData();
            } else if (formKind === 'create') {
                await employeeService.create({
                    name: formData.name,
                    surname: formData.surname,
                    patronymic: formData.patronymic,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email || null,
                    workplaces: formData.workplaces
                });
                toast.success('Сотрудник успешно добавлен');
                closeModal();
                fetchData();
            }
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при сохранении'));
        }
    };

    const handleAccountSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        try {
            const newUser = await userService.createForEmployee(selectedEmployee.id, accountForm);
            setCreatedCredentials({ email: newUser.email, password: newUser.initialPassword });
            setModalMode('password');
            fetchData();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка при создании учетной записи'));
        }
    };

    const confirmDelete = async () => {
        try {
            if (selectedEmployee) {
                await employeeService.delete(selectedEmployee.id);
                toast.success('Сотрудник удален');
            } else if (selectedUser) {
                await userService.revokeAccess(selectedUser.id);
                toast.success('Доступ пользователя отозван');
            }
            closeModal();
            fetchData();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка удаления'));
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        try {
            const res = await userService.forceResetPassword(selectedUser.id);
            setCreatedCredentials({ email: res.email, password: res.initialPassword });
            setModalMode('password');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ошибка сброса пароля'));
        }
    };

    const formatWorkplaces = (workplaces?: { institutionName: string }[]) => {
        if (!workplaces?.length) return <span className="text-muted">-</span>;
        return workplaces.map(w => w.institutionName).join(', ');
    };

    const employeeColumns: ColumnDef<GetEmployeeResponse>[] = [
        {
            header: 'ФИО',
            renderCell: (emp) => `${emp.surname} ${emp.name} ${emp.patronymic || ''}`.trim()
        },
        {
            header: 'Email',
            renderCell: (emp) => emp.email || <span className="text-muted">-</span>
        },
        {
            header: 'Телефон',
            renderCell: (emp) => emp.phoneNumber || <span className="text-muted">-</span>
        },
        {
            header: 'Учреждения',
            renderCell: (emp) => formatWorkplaces(emp.workplaces)
        },
        {
            header: 'Является пользователем',
            renderCell: (emp) => (
                <span style={{ color: emp.isUser ? '#22c55e' : '#ef4444', fontSize: '16px' }}>
                    {emp.isUser ? '✓' : '✕'}
                </span>
            )
        }
    ];

    const userColumns: ColumnDef<GetUserResponse>[] = [
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
            header: 'Учреждения',
            renderCell: (u) => formatWorkplaces(u.workplaces)
        }
    ];

    const availableRoleOptions = roleOptions.filter(opt => {
        // При редактировании всегда показываем текущую роль пользователя
        if (formKind === 'edit-user' && formData.role === opt.value) return true;

        if (currentUser?.role === UserRole.SuperAdmin) return true;

        if (currentUser?.role === UserRole.Operator) {
            return opt.value === UserRole.User || opt.value === UserRole.UserAdmin;
        }

        if (currentUser?.role === UserRole.UserAdmin) {
            return opt.value === UserRole.User;
        }

        return opt.value === UserRole.User;
    });

    const canChangeRole = availableRoleOptions.length > 1 && (
        currentUser?.role === UserRole.SuperAdmin || currentUser?.role === UserRole.Operator
    );
    const canManageWorkplaces = isStaff || isUserAdmin;

    return (
        <div className="content-body">
            <PageHeader
                title="Сотрудники и пользователи"
                actionLabel="Добавить сотрудника"
                onAction={handleCreateClick}
                leftContent={
                    <div className="role-tabs">
                        <button className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => handleTabChange('employees')}>Сотрудники</button>
                        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleTabChange('users')}>Пользователи</button>
                    </div>
                }
            />

            <div className="data-card">
                <TableToolbar searchPlaceholder={activeTab === 'employees' ? 'Поиск сотрудников...' : 'Поиск пользователей...'} />

                {activeTab === 'employees' ? (
                    <DataTable<GetEmployeeResponse>
                        columns={employeeColumns}
                        data={employees}
                        isLoading={isLoading}
                        onRowClick={handleEmployeeRowClick}
                        emptyMessage="Сотрудники не найдены"
                    />
                ) : (
                    <DataTable<GetUserResponse>
                        columns={userColumns}
                        data={users}
                        isLoading={isLoading}
                        onRowClick={handleUserRowClick}
                        emptyMessage="Пользователи не найдены"
                    />
                )}

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
                    <div className="modal-backdrop" onClick={closeModal} />
                    <div className="modal-panel">
                        <button className="close-btn" onClick={closeModal}>✕</button>

                        {modalMode === 'details' && selectedEmployee && (
                            <div className="modal-details">
                                <h3>{selectedEmployee.surname} {selectedEmployee.name} {selectedEmployee.patronymic || ''}</h3>
                                <p><strong>Email:</strong> {selectedEmployee.email || '-'}</p>
                                <p><strong>Телефон:</strong> {selectedEmployee.phoneNumber || '-'}</p>
                                <p>
                                    <strong>Учреждения:</strong>{' '}
                                    {selectedEmployee.workplaces?.length
                                        ? selectedEmployee.workplaces.map(w => w.institutionName).join(', ')
                                        : '-'}
                                </p>
                                <p>
                                    <strong>Является пользователем:</strong>{' '}
                                    <span style={{ color: selectedEmployee.isUser ? '#22c55e' : '#ef4444' }}>
                                        {selectedEmployee.isUser ? 'Да' : 'Нет'}
                                    </span>
                                </p>

                                <div className="modal-actions">
                                    <button className="action-btn-secondary" onClick={handleEditClick}>Редактировать</button>
                                    {!selectedEmployee.isUser && (
                                        <button className="action-btn-primary" onClick={handleCreateAccountClick}>Создать учетную запись</button>
                                    )}
                                    <button className="action-btn-danger" onClick={() => setModalMode('delete')}>Удалить</button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'details' && selectedUser && (
                            <div className="modal-details">
                                <h3>{selectedUser.surname} {selectedUser.name} {selectedUser.patronymic || ''}</h3>
                                <p><strong>Email:</strong> {selectedUser.email}</p>
                                <p><strong>Телефон:</strong> {selectedUser.phoneNumber || '-'}</p>
                                <p><strong>Роль:</strong> {roleOptions.find(r => r.value === selectedUser.role)?.label}</p>
                                <p>
                                    <strong>Учреждения:</strong>{' '}
                                    {selectedUser.workplaces?.length
                                        ? selectedUser.workplaces.map(w => w.institutionName).join(', ')
                                        : '-'}
                                </p>

                                <div className="modal-actions">
                                    <button className="action-btn-secondary" onClick={handleEditClick}>Редактировать</button>
                                    <button className="action-btn-secondary" onClick={handleResetPassword}>Сбросить пароль</button>
                                    <button className="action-btn-danger" onClick={() => setModalMode('delete')}>Отозвать доступ</button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'delete' && selectedEmployee && (
                            <div className="modal-details">
                                <h3 className="modal-header-danger">Удаление сотрудника</h3>
                                <p>
                                    Вы действительно хотите удалить <strong>{selectedEmployee.surname} {selectedEmployee.name}</strong>?
                                    {selectedEmployee.isUser && ' Учетная запись пользователя также будет удалена.'}
                                </p>
                                <div className="modal-actions">
                                    <button className="action-btn-danger" onClick={confirmDelete}>Да, удалить</button>
                                    <button className="action-btn-secondary" onClick={() => setModalMode('details')}>Отмена</button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'delete' && selectedUser && (
                            <div className="modal-details">
                                <h3 className="modal-header-danger">Отзыв доступа</h3>
                                <p>Отозвать доступ у <strong>{selectedUser.email}</strong>? Карточка сотрудника сохранится.</p>
                                <div className="modal-actions">
                                    <button className="action-btn-danger" onClick={confirmDelete}>Да, отозвать</button>
                                    <button className="action-btn-secondary" onClick={() => setModalMode('details')}>Отмена</button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'password' && createdCredentials && (
                            <div className="modal-details">
                                <h3 className="modal-header-success">Пароль готов!</h3>
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
                                    <button className="action-btn-secondary" onClick={closeModal}>
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'account' && selectedEmployee && (
                            <form onSubmit={handleAccountSave} className="modal-form">
                                <h3>Учетная запись для {selectedEmployee.surname} {selectedEmployee.name}</h3>

                                <div className="form-group">
                                    <label>Email (Логин) *</label>
                                    <input required type="email" value={accountForm.email}
                                           onChange={e => setAccountForm({...accountForm, email: e.target.value})}/>
                                </div>

                                <div className="form-group">
                                    <label>Роль *</label>
                                    <select
                                        className="form-select"
                                        value={accountForm.role}
                                        onChange={e => setAccountForm({...accountForm, role: e.target.value as UserRole})}
                                        disabled={availableRoleOptions.length === 1}
                                    >
                                        {availableRoleOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <button type="submit" className="action-btn-primary modal-submit-btn">
                                    Создать учетную запись
                                </button>
                            </form>
                        )}

                        {modalMode === 'form' && (
                            <form onSubmit={handleSave} className="modal-form">
                                <h3>
                                    {formKind === 'edit-user'
                                        ? 'Редактирование пользователя'
                                        : formKind === 'edit-employee'
                                            ? 'Редактирование сотрудника'
                                            : 'Новый сотрудник'}
                                </h3>

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
                                           onChange={e => setFormData({...formData, patronymic: e.target.value || null})}/>
                                </div>
                                <div className="form-group">
                                    <label>Телефон</label>
                                    <input type="tel" value={formData.phoneNumber || ''}
                                           onChange={e => setFormData({...formData, phoneNumber: e.target.value || null})}/>
                                </div>
                                <div className="form-group">
                                    <label>Email {emailRequired ? '*' : ''}</label>
                                    <input
                                        required={emailRequired}
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>

                                {formKind === 'create' && (
                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.makeUser}
                                                onChange={e => setFormData({...formData, makeUser: e.target.checked})}
                                                style={{ width: 'auto' }}
                                            />
                                            Сделать пользователем
                                        </label>
                                    </div>
                                )}

                                {showRoleField && (
                                    <div className="form-group">
                                        <label>Роль *</label>
                                        <select
                                            className="form-select"
                                            value={formData.role}
                                            onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                            disabled={!canChangeRole}
                                        >
                                            {availableRoleOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {canManageWorkplaces && (
                                    <div className="form-group">
                                        <label>
                                            Учреждения
                                            {isUserForm && roleRequiresWorkplace(formData.role) ? ' *' : ''}
                                        </label>

                                        {formData.workplaces.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                                {formData.workplaces.map(w => (
                                                    <div key={w.institutionId} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '6px 10px',
                                                        background: '#f1f5f9',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        <span>{getInstitutionName(w.institutionId)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeWorkplace(w.institutionId)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {isStaff && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <select
                                                    className="form-select"
                                                    value={selectedInstitutionId}
                                                    onChange={e => setSelectedInstitutionId(e.target.value)}
                                                    style={{ flex: 1 }}
                                                >
                                                    <option value="">-- Добавить учреждение --</option>
                                                    {institutionsList
                                                        .filter(i => !formData.workplaces.some(w => w.institutionId === i.id))
                                                        .map(inst => (
                                                            <option key={inst.id} value={inst.id}>
                                                                {inst.name} (ИНН: {inst.inn})
                                                            </option>
                                                        ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="action-btn-secondary"
                                                    onClick={addWorkplace}
                                                    disabled={!selectedInstitutionId}
                                                >
                                                    Добавить
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button type="submit" className="action-btn-primary modal-submit-btn">
                                    Сохранить
                                </button>
                            </form>
                        )}                    </div>
                </>
            )}
        </div>
    );
};
