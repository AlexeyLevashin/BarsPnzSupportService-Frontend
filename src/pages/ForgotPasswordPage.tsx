import { Link } from 'react-router-dom';
import { PasswordResetForm } from '../components/PasswordResetForm';
import { authService } from '../services/auth.service';
import '../css/login.css';

export const ForgotPasswordPage = () => (
    <div className="page-wrapper">
        <div className="login-card">
            <div className="title-section"><h1>Восстановление пароля</h1><p>Подтвердите email кодом из письма</p></div>
            <PasswordResetForm initialEmail={authService.getCurrentUser()?.email ?? ''} />
            <p className="profile-back"><Link to="/login">Вернуться ко входу</Link></p>
        </div>
    </div>
);
