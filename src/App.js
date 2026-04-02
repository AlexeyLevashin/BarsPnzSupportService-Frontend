import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';
import { MainLayout } from './components/ui/MainLayout';
import { RequestsPage } from './pages/RequestPage';
import { InstitutionsPage } from './pages/InstitutionPage';
import { UsersPage } from "./pages/UserPage";
export const App = () => {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { element: _jsx(PrivateRoute, {}), children: _jsxs(Route, { element: _jsx(MainLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(RequestsPage, {}) }), _jsx(Route, { path: "/institutions", element: _jsx(InstitutionsPage, {}) }), _jsx(Route, { path: "/users", element: _jsx(UsersPage, {}) })] }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
};
//# sourceMappingURL=App.js.map