import { axiosInstance } from '../api/axiosInstance';
export const authApi = {
    login: async (credentials) => {
        const response = await axiosInstance.post('/auth/login', credentials);
        return response.data;
    }
};
//# sourceMappingURL=auth.api.js.map