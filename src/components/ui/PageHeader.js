import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, {} from 'react';
export const PageHeader = ({ title, actionLabel, actionIcon, onAction, leftContent }) => {
    return (_jsxs("div", { className: "page-header", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }, children: [_jsxs("div", { className: "header-left", style: { display: 'flex', alignItems: 'center', gap: '24px' }, children: [_jsx("h2", { className: "page-title", style: { fontSize: '20px', fontWeight: 600, margin: 0 }, children: title }), leftContent] }), actionLabel && (_jsx("div", { className: "header-right", children: _jsxs("button", { className: "action-btn-primary", onClick: onAction, children: [actionIcon, actionLabel] }) }))] }));
};
//# sourceMappingURL=PageHeader.js.map