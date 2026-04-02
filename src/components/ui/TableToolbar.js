import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, {} from 'react';
export const TableToolbar = ({ searchPlaceholder, onSearch, filters }) => {
    return (_jsxs("div", { className: "table-toolbar", children: [_jsx("div", { className: "filters", children: filters }), searchPlaceholder && (_jsxs("div", { className: "search-box", children: [_jsxs("svg", { className: "search-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }), _jsx("input", { type: "text", placeholder: searchPlaceholder, onChange: (e) => onSearch && onSearch(e.target.value) })] }))] }));
};
//# sourceMappingURL=TableToolbar.js.map