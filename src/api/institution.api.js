import { axiosInstance } from "./axiosInstance";
export const institutionApi = {
    getAll: async (pageData) => {
        const response = await axiosInstance.get('/institutions', { params: pageData });
        return response.data;
    },
    getById: async (id) => {
        const response = await axiosInstance.get(`/institutions/${id}`);
        return response.data;
    },
    getMy: async () => {
        const response = await axiosInstance.get('/institutions/my'); // или какой там у тебя роут
        return response.data;
    },
    create: async (institutionData) => {
        const response = await axiosInstance.post('/institutions', institutionData);
        return response.data;
    },
    update: async (id, institutionData) => {
        const response = await axiosInstance.put(`/institutions/${id}`, institutionData);
        return response.data;
    },
    delete: async (id) => {
        await axiosInstance.delete(`/institutions/${id}`);
    }
};
//# sourceMappingURL=institution.api.js.map