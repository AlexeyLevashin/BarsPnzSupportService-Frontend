import { authApi } from '../api/auth.api';
import { tokenUtil } from '../lib/token';
import type {LoginRequest} from "../types/auth.types";
import {UserRole} from "../types/user.types";
import axios from "axios";

export const authService = {
    login: async (credentials: LoginRequest) => {
        const data = await authApi.login(credentials);

        tokenUtil.save(data);

        return data;
    },

    refreshToken: async () => {
        const tokens = tokenUtil.get();

        if (!tokens.refreshToken) {
            authService.logout();
            return Promise.reject(new Error('Нет Refresh-токена'));
        }

        try {
            const res = await axios.post(`/api/auth/refresh-token`, {
                refreshToken: tokens.refreshToken
            });

            tokenUtil.save(res.data);
            return res.data;
        } catch (error) {
            console.warn('Refresh-токен умер. Выкидываем на форму логина.');
            authService.logout();
            return Promise.reject(error);
        }
    },

    logout: () => {
        tokenUtil.remove();
        window.location.href = '/login';
    },

    getCurrentUser: () => {
        const { accessToken } = tokenUtil.get();
        if (!accessToken) return null;

        try {
            const payloadBase64 = accessToken.split('.')[1];
            if (!payloadBase64) return null;
            const payloadJson = decodeURIComponent(
                atob(payloadBase64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            );
            const payload = JSON.parse(payloadJson);

            const roleString = payload.role as keyof typeof UserRole;
            const finalRole = UserRole[roleString] ?? UserRole.User;

            return {
                id: payload.nameid,
                email: payload.email,
                role: finalRole,
                institutionId: payload.InstitutionId || payload.institutionId || null
            };
        } catch (error) {
            console.error('Ошибка расшифровки JWT-токена:', error);
            return null;
        }
    }
};