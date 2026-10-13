import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '../lib/errorHandler';
import '../css/profile.css';

interface PasswordResetFormProps { initialEmail?: string; }

export const PasswordResetForm = ({ initialEmail = '' }: PasswordResetFormProps) => {
    const id = useId();
    const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>('email');
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [resendAt, setResendAt] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const update = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
        update();
        const timer = window.setInterval(update, 1000);
        return () => window.clearInterval(timer);
    }, [resendAt]);

    const sendCode = async () => {
        setError('');
        setBusy(true);
        try {
            await authService.requestPasswordReset({ email: email.trim() });
            setEmail(email.trim());
            setCode('');
            setResetToken('');
            setResendAt(Date.now() + 60000);
            setStep('code');
        } catch (failure) {
            setError(getErrorMessage(failure, 'Не удалось запросить код'));
        } finally { setBusy(false); }
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (step === 'email') { await sendCode(); return; }
        setError('');
        if (step === 'password' && password !== confirmation) { setError('Пароли не совпадают'); return; }
        setBusy(true);
        try {
            if (step === 'code') {
                const result = await authService.verifyPasswordReset({ email, code });
                setResetToken(result.resetToken);
                setStep('password');
            } else if (step === 'password') {
                await authService.confirmPasswordReset({ resetToken, newPassword: password, confirmPassword: confirmation });
                setResetToken('');
                setPassword('');
                setConfirmation('');
                setStep('done');
            }
        } catch (failure) {
            setError(getErrorMessage(failure, 'Не удалось восстановить пароль'));
        } finally { setBusy(false); }
    };

    return <div className="password-reset-form">
        {step === 'done' ? <div role="status"><p>Пароль изменён. Теперь вы можете войти с новым паролем.</p><Link to="/login">Перейти ко входу</Link></div> : <>
            <h4>{step === 'email' ? 'Восстановление пароля' : step === 'code' ? 'Введите код из письма' : 'Установите новый пароль'}</h4>
            {step === 'code' && <p className="profile-hint">Если аккаунт {email} существует, письмо с кодом будет отправлено. Код действует 10 минут.</p>}
            <form onSubmit={submit}>
                <fieldset className="profile-fieldset" disabled={busy}>
                    {step === 'email' && <label htmlFor={`${id}-email`}>Email<input id={`${id}-email`} required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>}
                    {step === 'code' && <label htmlFor={`${id}-code`}>Код из 6 цифр<input id={`${id}-code`} required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} /></label>}
                    {step === 'password' && <>
                        <label htmlFor={`${id}-password`}>Новый пароль<input id={`${id}-password`} required type="password" minLength={6} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
                        <label htmlFor={`${id}-confirm`}>Подтвердите пароль<input id={`${id}-confirm`} required type="password" minLength={6} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
                    </>}
                    {error && <p className="profile-error" role="alert">{error}</p>}
                    <div className="profile-actions">
                        <button className="action-btn-primary" type="submit">{busy ? 'Подождите...' : step === 'email' ? 'Отправить код' : step === 'code' ? 'Проверить код' : 'Сохранить пароль'}</button>
                        {step === 'code' && <button className="action-btn-secondary" type="button" disabled={seconds > 0} onClick={() => void sendCode()}>{seconds > 0 ? `Повторить через ${seconds} с` : 'Отправить ещё раз'}</button>}
                        {step !== 'email' && <button type="button" className="action-btn-secondary" onClick={() => { setStep('email'); setError(''); setResetToken(''); setCode(''); setPassword(''); setConfirmation(''); }}>Начать заново</button>}
                    </div>
                </fieldset>
            </form>
        </>}
    </div>;
};
