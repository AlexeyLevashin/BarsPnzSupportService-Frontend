import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';

export const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<PrivateRoute />}>

                    <Route path="/" element={<div>Главная страница (скоро здесь будут заявки)</div>} />
                    <Route path="/orders" element={<div>Страница заявок (в разработке)</div>} />

                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};