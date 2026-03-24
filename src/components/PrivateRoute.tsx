import { Navigate, Outlet } from 'react-router-dom';
import { tokenUtil } from '../lib/token';

export const PrivateRoute = () => {
    const tokens = tokenUtil.get();

    if (!tokens.accessToken && !tokens.refreshToken) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};