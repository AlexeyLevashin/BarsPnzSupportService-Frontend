import axios from 'axios';
import { tokenUtil } from '../lib/token';
import {authService} from "../services/auth.service";

export const axiosInstance = axios.create({
    baseURL: '/api'
});

axiosInstance.interceptors.request.use(
    (config) => {
        const tokens = tokenUtil.get();

        if (tokens.accessToken) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !(originalRequest as any)._isRetry) {
            (originalRequest as any)._isRetry = true;

            try {
                const newData = await authService.refreshToken();

                originalRequest.headers.Authorization = `Bearer ${newData.accessToken}`;
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);