import { axiosInstance } from './axiosInstance';
import type { CreateEmployeeRequest, GetEmployeeResponse } from '../types/employee.types';
import type { PagedResponse, PaginationParams } from '../types/common.types';

export const employeeApi = {
    getAll: async (pageData: PaginationParams): Promise<PagedResponse<GetEmployeeResponse>> => {
        const response = await axiosInstance.get('/employees', { params: pageData });
        return response.data as PagedResponse<GetEmployeeResponse>;
    },

    create: async (data: CreateEmployeeRequest): Promise<string> => {
        const response = await axiosInstance.post('/employees', data);
        return response.data as string;
    },

    update: async (id: string, data: CreateEmployeeRequest): Promise<string> => {
        const response = await axiosInstance.put(`/employees/${id}`, data);
        return response.data as string;
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/employees/${id}`);
    }
};
