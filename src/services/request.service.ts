import { requestApi } from '../api/request.api';
import type { PaginationParams } from '../types/common.types';
import type { CreateRequestFormState } from '../types/request.types';

export const requestService = {
    getAll: async (pageData: PaginationParams) => {
        return await requestApi.getAll(pageData)
    },

    getMy: async (pageData: PaginationParams) => {
        return await requestApi.getMy(pageData)
    },

    create: async (data: CreateRequestFormState) => {
        return await requestApi.create(data)
    },

    assignToOperator: async (id: string) => {
        return await requestApi.assignToOperator(id)
    }
};