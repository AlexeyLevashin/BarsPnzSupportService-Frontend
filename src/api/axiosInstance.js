import axios from 'axios';
import { tokenUtil } from '../lib/token';
export const axiosInstance = axios.create({
    baseURL: '/api'
});
axiosInstance.interceptors.request.use((config) => {
    const tokens = tokenUtil.get();
    if (tokens.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
axiosInstance.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._isRetry) {
        originalRequest._isRetry = true;
        const tokens = tokenUtil.get();
        if (!tokens.refreshToken) {
            tokenUtil.remove();
            window.location.href = '/login';
            return Promise.reject(new Error('Нет Refresh-токена'));
        }
        try {
            const res = await axios.post('/api/auth/refresh-token', {
                refreshToken: tokens.refreshToken
            });
            tokenUtil.save(res.data);
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return axiosInstance(originalRequest);
        }
        catch (refreshError) {
            console.warn('Refresh-токен умер. Выкидываем на форму логина.'); // todo на проде убрать
            tokenUtil.remove();
            window.location.href = '/login';
            return Promise.reject(refreshError);
        }
    }
    return Promise.reject(error);
});
//# sourceMappingURL=axiosInstance.js.map