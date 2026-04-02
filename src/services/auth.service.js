import { authApi } from '../api/auth.api';
import { tokenUtil } from '../lib/token';
import { UserRole } from "../types/user.types";
export const authService = {
    login: async (credentials) => {
        const data = await authApi.login(credentials);
        tokenUtil.save(data);
        return data;
    },
    logout: () => {
        tokenUtil.remove();
        window.location.href = '/login';
    },
    getCurrentUser: () => {
        const { accessToken } = tokenUtil.get();
        if (!accessToken)
            return null;
        try {
            const payloadBase64 = accessToken.split('.')[1];
            if (!payloadBase64)
                return null;
            const payloadJson = decodeURIComponent(atob(payloadBase64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(payloadJson);
            const roleString = payload.role;
            const finalRole = UserRole[roleString] ?? UserRole.User;
            return {
                id: payload.nameid,
                email: payload.email,
                role: finalRole,
                institutionId: payload.InstitutionId || payload.institutionId || null
            };
        }
        catch (error) {
            console.error('Ошибка расшифровки JWT-токена:', error);
            return null;
        }
    }
};
//# sourceMappingURL=auth.service.js.map