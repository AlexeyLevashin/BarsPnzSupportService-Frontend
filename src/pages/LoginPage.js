import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import '../css/login.css';
export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await authService.login({ email, password });
            navigate('/');
        }
        catch (err) {
            console.error('Ошибка входа:', err);
            setError('Неверная почта или пароль.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "page-wrapper", children: _jsxs("div", { className: "login-card", children: [_jsxs("div", { className: "brand-header", children: [_jsx("div", { className: "brand-logo", children: _jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }), _jsx("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }), _jsx("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" })] }) }), _jsx("div", { className: "brand-name", children: "BarsPnzSupportService" })] }), _jsxs("div", { className: "title-section", children: [_jsx("h1", { children: "\u0412\u0445\u043E\u0434 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443" }), _jsx("p", { children: "\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0443\u0439\u0442\u0435\u0441\u044C \u0434\u043B\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0441\u0435\u0440\u0432\u0438\u0441\u0443" })] }), _jsx("div", { className: "error-message login-error", children: error }), _jsxs("form", { id: "loginForm", onSubmit: handleLogin, autoComplete: "off", children: [_jsxs("div", { className: "input-group", children: [_jsx("label", { htmlFor: "email", children: "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430" }), _jsx("div", { className: "input-wrapper", children: _jsx("input", { type: "email", id: "email", value: email, onChange: (e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                        }, placeholder: "example@mail.ru", required: true, autoComplete: "username" }) })] }), _jsxs("div", { className: "input-group", children: [_jsxs("div", { className: "label-row", children: [_jsx("label", { htmlFor: "password", children: "\u041F\u0430\u0440\u043E\u043B\u044C" }), _jsx("a", { href: "#", className: "forgot-password", tabIndex: -1, children: "\u0417\u0430\u0431\u044B\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C?" })] }), _jsxs("div", { className: "input-wrapper", children: [_jsx("input", { type: showPassword ? "text" : "password", id: "password", value: password, onChange: (e) => {
                                                setPassword(e.target.value);
                                                setError('');
                                            }, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0432\u0430\u0448 \u043F\u0430\u0440\u043E\u043B\u044C", required: true, autoComplete: "current-password" }), _jsx("button", { type: "button", className: "password-toggle", onClick: () => setShowPassword(!showPassword), "aria-label": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C", children: _jsxs("svg", { id: "eyeIcon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] }) })] })] }), _jsx("button", { type: "submit", className: "submit-btn", disabled: isLoading, children: isLoading ? 'Загрузка...' : 'Войти' })] })] }) }));
};
//# sourceMappingURL=LoginPage.js.map