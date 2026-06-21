import { axiosInstance } from './axiosInstance';
import type {
    CreateUserResponse,
    GetUserResponse,
    CreateUserByAdminRequest,
    GetOperatorResponse
} from "../types/user.types";
import type {PagedResponse, PaginationParams} from "../types/common.types";

export const userApi = {
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

    create:  async (userData: CreateUserByAdminRequest): Promise<CreateUserResponse> => {
        const response = await axiosInstance.post('/users', userData)

        return response.data as CreateUserResponse;
    },

    update: async (id: string, userData: CreateUserByAdminRequest): Promise<CreateUserResponse> => {
        const response = await axiosInstance.put(`/users/${id}`, userData);

        return response.data as CreateUserResponse;
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/users/${id}`);
    }
}