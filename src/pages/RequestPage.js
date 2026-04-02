import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { TableToolbar } from '../components/ui/TableToolbar';
import { DataTable } from '../components/ui/DataTable';
export const RequestsPage = () => {
    // Временные данные (хардкод)
    const requestsData = [
        { id: 1, title: 'Ошибка при работе с данными', status: 'Новая', creatorEmail: 'ivanov@example.com', creatorRole: 'Пользователь', creatorInitials: 'И', createdAt: '25.03.2026 10:15' }
    ];
    const columns = [
        {
            header: _jsx("input", { type: "checkbox" }),
            width: 40,
            renderCell: () => _jsx("input", { type: "checkbox" })
        },
        {
            header: 'ТЕМА ЗАЯВКИ',
            renderCell: (item) => _jsx("span", { className: "item-name", children: item.title })
        },
        {
            header: 'СТАТУС',
            renderCell: (item) => (_jsx("span", { className: `status-badge ${item.status === 'Новая' ? 'status-new' : 'status-in-progress'}`, children: item.status }))
        },
        {
            header: 'СОЗДАЛ',
            renderCell: (item) => (_jsxs("div", { className: "user-cell", children: [_jsx("div", { className: "user-avatar", children: item.creatorInitials }), _jsxs("div", { className: "user-info", children: [_jsx("span", { className: "user-email", children: item.creatorEmail }), _jsx("span", { className: "user-role", children: item.creatorRole })] })] }))
        },
        {
            header: 'ДАТА СОЗДАНИЯ',
            key: 'createdAt'
        },
        {
            header: '',
            width: 50,
            renderCell: () => (_jsx("button", { className: "more-btn", children: _jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "12", r: "1" }), _jsx("circle", { cx: "19", cy: "12", r: "1" }), _jsx("circle", { cx: "5", cy: "12", r: "1" })] }) }))
        }
    ];
    return (_jsxs("div", { className: "content-body", children: [_jsx(PageHeader, { title: "\u0421\u043F\u0438\u0441\u043E\u043A \u0437\u0430\u044F\u0432\u043E\u043A", actionLabel: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443", actionIcon: _jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: '8px' }, children: [_jsx("line", { x1: "12", y1: "5", x2: "12", y2: "19" }), _jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" })] }), leftContent: _jsxs("div", { className: "role-tabs", children: [_jsx("button", { className: "tab-btn active", children: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044B\u0435" }), _jsx("button", { className: "tab-btn", children: "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0435" })] }) }), _jsxs("div", { className: "data-card", children: [_jsx(TableToolbar, { searchPlaceholder: "\u041F\u043E\u0438\u0441\u043A \u0437\u0430\u044F\u0432\u043E\u043A...", filters: _jsxs(_Fragment, { children: [_jsxs("button", { className: "filter-btn", children: ["\u0412\u0441\u0435 \u0442\u0438\u043F\u044B", _jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("polyline", { points: "6 9 12 15 18 9" }) })] }), _jsxs("button", { className: "filter-btn", children: [_jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }) }), "\u0424\u0438\u043B\u044C\u0442\u0440\u044B"] })] }) }), _jsx(DataTable, { columns: columns, data: requestsData, isLoading: false })] })] }));
};
//# sourceMappingURL=RequestPage.js.map