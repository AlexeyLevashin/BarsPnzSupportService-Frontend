import { axiosInstance } from './axiosInstance';
export const userApi = {
    getAll: async (pageData) => {
        const response = await axiosInstance.get('/users', { params: pageData });
        return response.data;
    },
    getById: async (id) => {
        const response = await axiosInstance.get(`/users/${id}`);
        return response.data;
    },
    create: async (userData) => {
        const response = await axiosInstance.post('/users', userData);
        return response.data;
    },
    update: async (id, userData) => {
        const response = await axiosInstance.put(`/users/${id}`, userData);
        return response.data;
    },
    delete: async (id) => {
        await axiosInstance.delete(`/users/${id}`);
    }
};
//# sourceMappingURL=user.api.js.map