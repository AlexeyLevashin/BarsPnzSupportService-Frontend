import { institutionApi } from '../api/institution.api';
import type { CreateInstitutionRequest } from '../types/institution.types';
import type {PaginationParams} from '../types/common.types'

export const institutionService = {
    getAll: async (pageData: PaginationParams) => {
        return await institutionApi.getAll(pageData);
    },

    getById: async (id: string) => {
        return await institutionApi.getById(id);
    },

    getMy: async () => {
        return await institutionApi.getMy();
    },

    create: async (data: CreateInstitutionRequest) => {
        return await institutionApi.create(data);
    },

    update: async (id: string, data: CreateInstitutionRequest) => {
        return await institutionApi.update(id, data);
    },

    delete: async (id: string) => {
        return await institutionApi.delete(id);
    }
};