import { axiosInstance } from './axiosInstance';
import type {
    CreateUserResponse,
    GetUserResponse,
    CreateUserByAdminRequest,
    CreateUserWithEmployeeRequest,
    GetOperatorResponse
} from "../types/user.types";
import type {PagedResponse, PaginationParams} from "../types/common.types";

export const userApi = {
    getMe: async (): Promise<GetUserResponse> => {
        const response = await axiosInstance.get('/users/me');
        return response.data as GetUserResponse;
    },

    getAll: async (pageData: PaginationParams): Promise<PagedResponse<GetUserResponse>> => {
        const response = await axiosInstance.get('/users', {params: pageData});
        return response.data as PagedResponse<GetUserResponse>;
    },

    getOperators: async (): Promise<GetOperatorResponse[]> => {
        const response = await axiosInstance.get('/users/operators');
        return response.data;
    },

    getById: async (id: string): Promise<GetUserResponse> => {
        const response = await axiosInstance.get(`/users/${id}`);
        return response.data as GetUserResponse;
    },

    getByEmployeeId: async (employeeId: string): Promise<GetUserResponse> => {
        const response = await axiosInstance.get(`/users/by-employee/${employeeId}`);
        return response.data as GetUserResponse;
    },

    // Добавить пользователя к существующему сотруднику
    createForEmployee: async (employeeId: string, userData: CreateUserByAdminRequest): Promise<CreateUserResponse> => {
        const response = await axiosInstance.post(`/users/${employeeId}`, userData);
        return response.data as CreateUserResponse;
    },

    // Создать сотрудника + пользователя одновременно
    createWithEmployee: async (userData: CreateUserWithEmployeeRequest): Promise<CreateUserResponse> => {
        const response = await axiosInstance.post('/users/with-employee', userData);
        return response.data as CreateUserResponse;
    },

    update: async (id: string, userData: CreateUserWithEmployeeRequest): Promise<GetUserResponse> => {
        const response = await axiosInstance.put(`/users/${id}`, userData);
        return response.data as GetUserResponse;
    },

    forceResetPassword: async (id: string): Promise<CreateUserResponse> => {
        const response = await axiosInstance.put(`/users/${id}/reset-password`);
        return response.data as CreateUserResponse;
    },

    revokeAccess: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/users/${id}`);
    }
}
