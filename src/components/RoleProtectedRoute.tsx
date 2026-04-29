import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { UserRole } from '../types/user.types';

interface RoleProtectedRouteProps {
    allowedRoles: UserRole[];
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/requests" replace />;
    }

    return <Outlet />;
};