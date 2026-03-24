import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';
export const App = () => {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { element: _jsx(PrivateRoute, {}), children: [_jsx(Route, { path: "/", element: _jsx("div", { children: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 (\u0441\u043A\u043E\u0440\u043E \u0437\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0443\u0442 \u0437\u0430\u044F\u0432\u043A\u0438)" }) }), _jsx(Route, { path: "/orders", element: _jsx("div", { children: "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0437\u0430\u044F\u0432\u043E\u043A (\u0432 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435)" }) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
};
//# sourceMappingURL=App.js.map