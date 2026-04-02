import { userApi } from '../api/user.api';
export const userService = {
    getAll: async (pageData) => {
        return await userApi.getAll(pageData);
    },
    getById: async (id) => {
        return await userApi.getById(id);
    },
    create: async (userData) => {
        return await userApi.create(userData);
    },
    update: async (id, userData) => {
        return await userApi.update(id, userData);
    },
    delete: async (id) => {
        return await userApi.delete(id);
    }
};
//# sourceMappingURL=user.service.js.map