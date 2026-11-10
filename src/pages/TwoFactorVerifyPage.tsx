import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { twoFactorTokenUtil } from '../lib/token';
import { getErrorMessage } from '../lib/errorHandler';
import '../css/login.css';

export const TwoFactorVerifyPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Токен подтверждения приходит из LoginPage (state) и дублируется в sessionStorage
    const token = (location.state as { twoFactorToken?: string } | null)?.twoFactorToken
        || twoFactorTokenUtil.get();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.verifyTwoFactor({ twoFactorToken: token, code: code.trim() });
            navigate('/');
        } catch (err: unknown) {
            console.error('Ошибка подтверждения 2FA:', err);
            setError(getErrorMessage(err, 'Неверный код подтверждения.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="login-card">
                <div className="title-section">
                    <h1>Подтверждение входа</h1>
                    <p>Введите код из приложения-аутентификатора или одноразовый код восстановления</p>
                </div>

                <div className="error-message login-error">
                    {error || (!token ? 'Сессия подтверждения истекла. Войдите заново.' : '')}
                </div>

                <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="input-group">
                        <label htmlFor="twoFactorCode">Код подтверждения</label>
                        <div className="input-wrapper">
                            <input
                                id="twoFactorCode"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    setError('');
                                }}
                                placeholder="123456"
                                required
                                autoFocus
                                autoComplete="one-time-code"
                                disabled={!token}
                            />
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading || !token}>
                        {isLoading ? 'Проверка...' : 'Подтвердить'}
                    </button>
                </form>

                <div className="label-row" style={{ marginTop: '16px', justifyContent: 'center' }}>
                    <Link to="/login" className="forgot-password" onClick={() => twoFactorTokenUtil.remove()}>
                        Войти другим аккаунтом
                    </Link>
                </div>
            </div>
        </div>
    );
};
