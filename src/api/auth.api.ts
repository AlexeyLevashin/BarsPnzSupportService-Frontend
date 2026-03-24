import { axiosInstance } from '../api/axiosInstance';

export const authApi = {
    login: async (credentials: any) => {
        const response = await axiosInstance.post('/auth/login', credentials);
        return response.data;
    }
};