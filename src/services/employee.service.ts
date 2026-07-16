import { employeeApi } from '../api/employee.api';
import type { CreateEmployeeRequest } from '../types/employee.types';
import type { PaginationParams } from '../types/common.types';

export const employeeService = {
    getAll: async (pageData: PaginationParams) => {
        return await employeeApi.getAll(pageData);
    },

    create: async (data: CreateEmployeeRequest) => {
        return await employeeApi.create(data);
    },

    update: async (id: string, data: CreateEmployeeRequest) => {
        return await employeeApi.update(id, data);
    },

    delete: async (id: string) => {
        return await employeeApi.delete(id);
    }
};
