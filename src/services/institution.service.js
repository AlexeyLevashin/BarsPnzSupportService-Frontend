import { institutionApi } from '../api/institution.api';
export const institutionService = {
    getAll: async (pageData) => {
        return await institutionApi.getAll(pageData);
    },
    getById: async (id) => {
        return await institutionApi.getById(id);
    },
    getMy: async () => {
        return await institutionApi.getMy();
    },
    create: async (data) => {
        return await institutionApi.create(data);
    },
    update: async (id, data) => {
        return await institutionApi.update(id, data);
    },
    delete: async (id) => {
        return await institutionApi.delete(id);
    }
};
//# sourceMappingURL=institution.service.js.map