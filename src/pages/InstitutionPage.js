import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { institutionService } from '../services/institution.service';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../css/institution.css';
import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable } from '../components/ui/DataTable';
export const InstitutionsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const [institutions, setInstitutions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [modalMode, setModalMode] = useState('none');
    const [selectedInst, setSelectedInst] = useState(null);
    const [formData, setFormData] = useState({
        name: '', inn: '', headName: '', headSurname: '', headPatronymic: ''
    });
    const fetchInstitutions = async () => {
        setIsLoading(true);
        try {
            const res = await institutionService.getAll({ page, pageSize });
            setInstitutions(res.items);
            setTotalPages(res.pageInfo.totalPages);
            setHasPrev(res.pageInfo.hasPreviousPage);
            setHasNext(res.pageInfo.hasNextPage);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchInstitutions();
    }, [page, pageSize]);
    const handleRowClick = (inst) => {
        setSelectedInst(inst);
        setModalMode('details');
    };
    const handleCreateClick = () => {
        setSelectedInst(null);
        setFormData({ name: '', inn: '', headName: '', headSurname: '', headPatronymic: '' });
        setModalMode('form');
    };
    const handleEditClick = () => {
        if (selectedInst) {
            setFormData({
                name: selectedInst.name,
                inn: selectedInst.inn,
                headName: selectedInst.headName || '',
                headSurname: selectedInst.headSurname || '',
                headPatronymic: selectedInst.headPatronymic || ''
            });
            setModalMode('form');
        }
    };
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedInst) {
                await institutionService.update(selectedInst.id, formData);
                toast.success('Учреждение успешно обновлено!');
            }
            else {
                await institutionService.create(formData);
                toast.success('Учреждение успешно добавлено!');
            }
            setModalMode('none');
            fetchInstitutions();
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    toast.error('У вас нет прав для выполнения этого действия');
                }
                else if (error.response?.data?.error) {
                    toast.error(error.response.data.error);
                }
                else {
                    toast.error('Произошла ошибка при сохранении');
                }
            }
            else {
                console.error(error);
            }
        }
    };
    const handleDeleteClick = () => {
        setModalMode('delete');
    };
    const confirmDelete = async () => {
        if (!selectedInst)
            return;
        try {
            await institutionService.delete(selectedInst.id);
            toast.success('Учреждение успешно удалено');
            setModalMode('none');
            fetchInstitutions();
        }
        catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                toast.error(error.response.data.error);
            }
            else {
                toast.error('Ошибка при удалении учреждения');
            }
        }
    };
    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage.toString(), pageSize: pageSize.toString() });
    };
    const columns = [
        { header: 'Наименование', key: 'name' },
        { header: 'ИНН', key: 'inn' },
        {
            header: 'Руководитель',
            renderCell: (inst) => `${inst.headSurname || ''} ${inst.headName || ''} ${inst.headPatronymic || ''}`.trim()
        }
    ];
    return (_jsxs("div", { className: "content-body", children: [_jsx(PageHeader, { title: "\u0423\u0447\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F", actionLabel: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0447\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435", onAction: handleCreateClick }), _jsxs("div", { className: "data-card", children: [_jsx(TableToolbar, { searchPlaceholder: "\u041F\u043E\u0438\u0441\u043A \u0443\u0447\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0439...", filters: _jsxs("button", { className: "filter-btn", children: [_jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }) }), "\u0424\u0438\u043B\u044C\u0442\u0440\u044B"] }) }), _jsx(DataTable, { columns: columns, data: institutions, isLoading: isLoading, onRowClick: handleRowClick }), _jsxs("div", { className: "pagination", children: [_jsx("button", { className: "action-btn-secondary", disabled: !hasPrev, onClick: () => handlePageChange(page - 1), children: "\u041D\u0430\u0437\u0430\u0434" }), _jsxs("span", { style: { margin: '0 16px', display: 'flex', alignItems: 'center' }, children: ["\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ", page, " \u0438\u0437 ", totalPages === 0 ? 1 : totalPages] }), _jsx("button", { className: "action-btn-secondary", disabled: !hasNext, onClick: () => handlePageChange(page + 1), children: "\u0412\u043F\u0435\u0440\u0435\u0434" })] })] }), modalMode !== 'none' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "modal-backdrop", onClick: () => setModalMode('none') }), _jsxs("div", { className: "modal-panel", children: [_jsx("button", { className: "close-btn", onClick: () => setModalMode('none'), children: "\u2715" }), modalMode === 'details' && selectedInst && (_jsxs("div", { className: "modal-details", children: [_jsx("h3", { children: selectedInst.name }), _jsxs("p", { children: [_jsx("strong", { children: "\u0418\u041D\u041D:" }), " ", selectedInst.inn] }), _jsxs("p", { children: [_jsx("strong", { children: "\u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C:" }), " ", selectedInst.headSurname, " ", selectedInst.headName, " ", selectedInst.headPatronymic] }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { className: "action-btn-secondary", onClick: handleEditClick, children: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }), _jsx("button", { className: "action-btn-danger", onClick: handleDeleteClick, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] })), modalMode === 'delete' && selectedInst && (_jsxs("div", { className: "modal-details", children: [_jsx("h3", { style: { color: '#ef4444', borderBottomColor: '#fee2e2' }, children: "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0443\u0447\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F" }), _jsxs("p", { children: ["\u0412\u044B \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C ", _jsx("strong", { children: selectedInst.name }), "?"] }), _jsx("p", { style: { fontSize: '13px', color: 'var(--text-muted)' }, children: "\u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043E\u0431\u0440\u0430\u0442\u0438\u043C\u043E." }), _jsxs("div", { className: "modal-actions", style: { marginTop: '24px' }, children: [_jsx("button", { className: "action-btn-danger", onClick: confirmDelete, children: "\u0414\u0430, \u0443\u0434\u0430\u043B\u0438\u0442\u044C" }), _jsx("button", { className: "action-btn-secondary", onClick: () => setModalMode('details'), children: "\u041E\u0442\u043C\u0435\u043D\u0430" })] })] })), modalMode === 'form' && (_jsxs("form", { onSubmit: handleSave, className: "modal-form", children: [_jsx("h3", { children: selectedInst ? 'Редактирование' : 'Новое учреждение' }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 *" }), _jsx("input", { required: true, value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u0418\u041D\u041D *" }), _jsx("input", { required: true, pattern: "\\d{10}|\\d{12}", title: "10 \u0438\u043B\u0438 12 \u0446\u0438\u0444\u0440", value: formData.inn, onChange: e => setFormData({ ...formData, inn: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u0424\u0430\u043C\u0438\u043B\u0438\u044F \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044F" }), _jsx("input", { value: formData.headSurname || '', onChange: e => setFormData({ ...formData, headSurname: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u0418\u043C\u044F \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044F" }), _jsx("input", { value: formData.headName || '', onChange: e => setFormData({ ...formData, headName: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "\u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044F" }), _jsx("input", { value: formData.headPatronymic || '', onChange: e => setFormData({ ...formData, headPatronymic: e.target.value }) })] }), _jsx("button", { type: "submit", className: "action-btn-primary", style: { marginTop: '16px', width: '100%', justifyContent: 'center' }, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" })] }))] })] }))] }));
};
//# sourceMappingURL=InstitutionPage.js.map