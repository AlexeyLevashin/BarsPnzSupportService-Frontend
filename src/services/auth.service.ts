// Файл: src/services/auth.service.ts
import { authApi } from '../api/auth.api';
import { tokenUtil } from '../lib/token';

export const authService = {
    login: async (credentials: any) => {
        const data = await authApi.login(credentials);

        tokenUtil.save(data);

        return data;
    },

    logout: () => {
        tokenUtil.remove();
        window.location.href = '/login';
    }
};