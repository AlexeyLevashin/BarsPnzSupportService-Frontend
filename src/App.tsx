import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';
import { MainLayout } from './components/ui/MainLayout';
import { RequestsPage } from './pages/RequestPage';
import { InstitutionsPage } from './pages/InstitutionPage';
import {UsersPage} from "./pages/UserPage";

export const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<PrivateRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<RequestsPage />} />
                        <Route path="/institutions" element={<InstitutionsPage />} />
                        <Route path="/users" element={<UsersPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};