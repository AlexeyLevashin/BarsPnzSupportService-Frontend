import { userApi } from '../api/user.api';
import type { CreateUserByAdminRequest } from '../types/user.types';
import type { PaginationParams } from '../types/common.types';

export const userService = {
    getAll: async (pageData: PaginationParams) => {
        return await userApi.getAll(pageData);
    },

    getById: async (id: string) => {
        return await userApi.getById(id);
    },

    create: async (userData: CreateUserByAdminRequest) => {
        return await userApi.create(userData);
    },

    update: async (id: string, userData: CreateUserByAdminRequest) => {
        return await userApi.update(id, userData);
    },

    delete: async (id: string) => {
        return await userApi.delete(id);
    }
};