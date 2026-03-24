import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
import { tokenUtil } from '../lib/token';
export const PrivateRoute = () => {
    const tokens = tokenUtil.get();
    if (!tokens.accessToken && !tokens.refreshToken) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(Outlet, {});
};
//# sourceMappingURL=PrivateRoute.js.map