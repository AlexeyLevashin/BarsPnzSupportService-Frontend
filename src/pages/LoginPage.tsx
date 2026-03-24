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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.login({ email, password });
            navigate('/');
        } catch (err: any) {
            console.error('Ошибка входа:', err);
            setError('Неверная почта или пароль.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="login-card">
                <div className="brand-header">
                    <div className="brand-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                    <div className="brand-name">BarsPnzSupportService</div>
                </div>

                <div className="title-section">
                    <h1>Вход в систему</h1>
                    <p>Пожалуйста, авторизуйтесь для доступа к сервису</p>
                </div>

                <div className="error-message login-error">
                    {error}
                </div>

                <form id="loginForm" onSubmit={handleLogin} autoComplete="off">
                    <div className="input-group">
                        <label htmlFor="email">Электронная почта</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                placeholder="example@mail.ru"
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="label-row">
                            <label htmlFor="password">Пароль</label>
                            <a href="#" className="forgot-password" tabIndex={-1}>Забыли пароль?</a>
                        </div>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                placeholder="Введите ваш пароль"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Показать пароль"
                            >
                                <svg id="eyeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Загрузка...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
};