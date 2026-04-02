import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { userService } from '../services/user.service';
import { institutionService } from '../services/institution.service';
import { UserRole } from '../types/user.types';
import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable } from '../components/ui/DataTable';
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
    const [users, setUsers] = useState([]);
    const [institutionsList, setInstitutionsList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [modalMode, setModalMode] = useState('none');
    const [selectedUser, setSelectedUser] = useState(null);
    const [createdCredentials, setCreatedCredentials] = useState(null);
    const initialFormState = {
        name: '', surname: '', patronymic: '', email: '', role: UserRole.User, institutionId: null
    };
    const [formData, setFormData] = useState(initialFormState);
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await userService.getAll({ page, pageSize });
            setUsers(res.items);
            setTotalPages(res.pageInfo.totalPages);
            setHasPrev(res.pageInfo.hasPreviousPage);
            setHasNext(res.pageInfo.hasNextPage);
        }
        catch (error) {
            toast.error('Ошибка загрузки пользователей');
        }
        finally {
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
        }
        catch (error) {
            console.error("Ошибка загрузки справочника:", error);
        }
    };
    useEffect(() => {
        fetchInstitutionsForDictionary();
    }, []);
    useEffect(() => {
        fetchUsers();
    }, [page, pageSize]);
    const handleRowClick = (user) => {
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
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await userService.update(selectedUser.id, formData);
                toast.success('Пользователь успешно обновлен');
                setModalMode('none');
                fetchUsers();
            }
            else {
                const newUser = await userService.create(formData);
                setCreatedCredentials({ email: newUser.email, password: newUser.initialPassword });
                setModalMode('password');
                fetchUsers();
            }
        }
        catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error);
            }
            else {
                toast.error('Ошибка при сохранении пользователя');
            }
        }
    };
    const confirmDelete = async () => {
        if (!selectedUser)
            return;
        try {
            await userService.delete(selectedUser.id);
            toast.success('Пользователь удален');
            setModalMode('none');
            fetchUsers();
        }
        catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error);
            }
            else {
                toast.error('Ошибка удаления');
            }
        }
    };
    const columns = [
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
                if (!u.institutionId)
                    return _jsx("span", { style: { color: 'var(--text-muted)' }, children: "-" });
                const inst = institutionsList.find(i => i.id === u.institutionId);
                return inst ? inst.name : 'Загрузка...';
            }
        }
    ];
    const availableRoleOptions = roleOptions.filter(opt => {
        if (currentUser?.role === UserRole.SuperAdmin)
            return true;
        if (currentUser?.role === UserRole.Operator) {
            return opt.value === UserRole.User || opt.value === UserRole.UserAdmin;
        }
        if (currentUser?.role === UserRole.UserAdmin) {
            return opt.value === UserRole.User;
        }
        return opt.value === UserRole.User;
    });
    return (_jsxs("div", { className: "content-body", children: [_jsx(PageHeader, { title: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438", actionLabel: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F", onAction: handleCreateClick }), _jsxs("div", { className: "data-card", children: [_jsx(TableToolbar, { searchPlaceholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439..." }), _jsx(DataTable, { columns: columns, data: users, isLoading: isLoading, onRowClick: handleRowClick, emptyMessage: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" }), _jsxs("div", { className: "pagination", children: [_jsx("button", { className: "action-btn-secondary", disabled: !hasPrev, onClick: () => setSearchParams({ page: (page - 1).toString() }), children: "\u041D\u0430\u0437\u0430\u0434" }), _jsxs("span", { style: { margin: '0 16px', display: 'flex', alignItems: 'center' }, children: ["\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ", page, " \u0438\u0437 ", totalPages === 0 ? 1 : totalPages] }), _jsx("button", { className: "action-btn-secondary", disabled: !hasNext, onClick: () => setSearchParams({ page: (page + 1).toString() }), children: "\u0412\u043F\u0435\u0440\u0435\u0434" })] })] }), modalMode !== 'none' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "modal-backdrop", onClick: () => setModalMode('none') }), _jsxs("div", { className: "modal-panel", children: [_jsx("button", { className: "close-btn", onClick: () => setModalMode('none'), children: "\u2715" }), modalMode === 'details' && selectedUser && (_jsxs("div", { className: "modal-details", children: [_jsxs("h3", { children: [selectedUser.surname, " ", selectedUser.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", selectedUser.email] }), _jsxs("p", { children: [_jsx("strong", { children: "\u0420\u043E\u043B\u044C:" }), " ", roleOptions.find(r => r.value === selectedUser.role)?.label] }), selectedUser.institutionId && (_jsxs("p", { children: [_jsx("strong", { children: "\u0423\u0447\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435:" }), " ", institutionsList.find(i => i.id === selectedUser.institutionId)?.name] })), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { className: "action-btn-secondary", onClick: handleEditClick, children: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }), _jsx("button", { className: "action-btn-danger", onClick: () => setModalMode('delete'), children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] })), modalMode === 'delete' && selectedUser && (_jsxs("div", { className: "modal-details", children: [_jsx("h3", { style: { color: '#ef4444', borderBottomColor: '#fee2e2' }, children: "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F" }), _jsxs("p", { children: ["\u0412\u044B \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C ", _jsx("strong", { children: selectedUser.email }), "?"] }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { className: "action-btn-danger", onClick: confirmDelete, children: "\u0414\u0430, \u0443\u0434\u0430\u043B\u0438\u0442\u044C" }), _jsx("button", { className: "action-btn-secondary", onClick: () => setModalMode('details'), children: "\u041E\u0442\u043C\u0435\u043D\u0430" })] })] })), modalMode === 'password' && createdCredentials && (_jsxs("div", { className: "modal-details", children: [_jsx("h3", { style: { color: 'var(--primary-color)', marginTop: 0 }, children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D!" }), _jsxs("p", { children: ["\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u0435 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C. ", _jsx("strong", { children: "\u041E\u043D \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0438\u0433\u0434\u0435 \u043D\u0435 \u0431\u0443\u0434\u0435\u0442 \u043F\u043E\u043A\u0430\u0437\u0430\u043D." })] }), _jsxs("div", { style: { backgroundColor: 'var(--sidebar-hover)', padding: '16px', borderRadius: '8px', margin: '16px 0', border: '1px solid var(--border-color)' }, children: [_jsxs("p", { style: { margin: '0 0 8px 0' }, children: [_jsx("strong", { children: "Email (\u041B\u043E\u0433\u0438\u043D):" }), " ", createdCredentials.email] }), _jsxs("p", { style: { margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }, children: [_jsx("strong", { children: "\u041F\u0430\u0440\u043E\u043B\u044C:" }), _jsx("span", { style: { fontFamily: 'monospace', fontSize: '18px', backgroundColor: 'var(--input-bg)', padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#ef4444', fontWeight: 'bold' }, children: createdCredentials.password })] })] }), _jsxs("div", { className: "modal-actions", style: { marginTop: '24px' }, children: [_jsxs("button", { className: "action-btn-primary", onClick: () => {
                                                    if (!createdCredentials)
                                                        return;
                                                    navigator.clipboard.writeText(`Логин: ${createdCredentials.email}\nПароль: ${createdCredentials.password}`);
                                                    toast.success('Данные скопированы в буфер обмена!');
                                                }, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2", style: { marginRight: '8px' }, children: [_jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }), _jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })] }), "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C"] }), _jsx("button", { className: "action-btn-secondary", onClick: () => setModalMode('none'), children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" })] })] })), modalMode === 'form' && (_jsxs("form", { onSubmit: handleSave, className: "modal-form", children: [_jsx("h3", { children: selectedUser ? 'Редактирование' : 'Новый пользователь' }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u0424\u0430\u043C\u0438\u043B\u0438\u044F *" }), _jsx("input", { required: true, value: formData.surname, onChange: e => setFormData({ ...formData, surname: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u0418\u043C\u044F *" }), _jsx("input", { required: true, value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx("input", { value: formData.patronymic || '', onChange: e => setFormData({ ...formData, patronymic: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Email *" }), _jsx("input", { required: true, type: "email", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u0420\u043E\u043B\u044C *" }), _jsx("select", { className: "form-select", value: formData.role, onChange: e => setFormData({ ...formData, role: Number(e.target.value) }), disabled: availableRoleOptions.length === 1, children: availableRoleOptions.map(opt => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u0423\u0447\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435" }), _jsxs("select", { className: "form-select", value: formData.institutionId || '', onChange: e => setFormData({
                                                    ...formData,
                                                    institutionId: e.target.value || null
                                                }), disabled: currentUser?.role !== UserRole.SuperAdmin && currentUser?.role !== UserRole.Operator, children: [_jsx("option", { value: "", children: "-- \u0411\u0435\u0437 \u0443\u0447\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F --" }), institutionsList.map(inst => (_jsxs("option", { value: inst.id, children: [inst.name, " (\u0418\u041D\u041D: ", inst.inn, ")"] }, inst.id)))] })] }), _jsx("button", { type: "submit", className: "action-btn-primary", style: { marginTop: '16px', width: '100%', justifyContent: 'center' }, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" })] }))] })] }))] }));
};
//# sourceMappingURL=UserPage.js.map