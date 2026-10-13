import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfilePage } from './pages/ProfilePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute'; // Подключаем нашу защиту
import { MainLayout } from './components/ui/MainLayout';
import { RequestsPage } from './pages/RequestPage';
import { InstitutionsPage } from './pages/InstitutionPage';
import { UsersPage } from './pages/UserPage';
import { RequestDetailsPage } from './pages/RequestDetailsPage';
import { UserRole } from './types/user.types'; // Не забудь импортировать роли
import { ValidationMessages } from './components/ValidationMessages';

export const App = () => {
    return (
        <BrowserRouter>
            <ValidationMessages />
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                <Route element={<PrivateRoute />}>

                    <Route element={<MainLayout />}>

                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/requests" element={<RequestsPage />} />
                        <Route path="/requests/:id" element={<RequestDetailsPage />} />
                        <Route path="/" element={<Navigate to="/requests" replace />} />

                        <Route element={<RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Operator]} />}>
                            <Route path="/institutions" element={<InstitutionsPage />} />
                        </Route>

                        <Route element={<RoleProtectedRoute allowedRoles={[UserRole.SuperAdmin, UserRole.Operator, UserRole.UserAdmin]} />}>
                            <Route path="/users" element={<UsersPage />} />
                        </Route>

                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
