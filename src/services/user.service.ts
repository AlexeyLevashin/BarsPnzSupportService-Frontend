import { userApi } from '../api/user.api';
import type { CreateUserByAdminRequest, CreateUserWithEmployeeRequest } from '../types/user.types';
import type { PaginationParams } from '../types/common.types';

export const userService = {
    getMe: async () => {
        return await userApi.getMe();
    },

    getAll: async (pageData: PaginationParams) => {
        return await userApi.getAll(pageData);
    },

    getOperators: async () => await userApi.getOperators(),

    getById: async (id: string) => {
        return await userApi.getById(id);
    },

    getByEmployeeId: async (employeeId: string) => {
        return await userApi.getByEmployeeId(employeeId);
    },

    createForEmployee: async (employeeId: string, userData: CreateUserByAdminRequest) => {
        return await userApi.createForEmployee(employeeId, userData);
    },

    createWithEmployee: async (userData: CreateUserWithEmployeeRequest) => {
        return await userApi.createWithEmployee(userData);
    },

    update: async (id: string, userData: CreateUserWithEmployeeRequest) => {
        return await userApi.update(id, userData);
    },

    forceResetPassword: async (id: string) => {
        return await userApi.forceResetPassword(id);
    },

    revokeAccess: async (id: string) => {
        return await userApi.revokeAccess(id);
    }
};
