import { axiosInstance } from './axiosInstance';
import type { PagedResponse, PaginationParams } from '../types/common.types';
import type { GetRequestResponse, CreateRequestFormState } from '../types/request.types';

export const requestApi = {
    getAll: async (pageData: PaginationParams): Promise<PagedResponse<GetRequestResponse>> => {
        const response = await axiosInstance.get('/requests/all', { params: pageData });
        return response.data as PagedResponse<GetRequestResponse>;
    },

    getMy: async (pageData: PaginationParams): Promise<PagedResponse<GetRequestResponse>> => {
        const response = await axiosInstance.get('/requests/all/my', { params: pageData });
        return response.data as PagedResponse<GetRequestResponse>;
    },

    getById: async (id: string): Promise<GetRequestResponse> => {
        const response = await axiosInstance.get(`/requests/${id}`);
        return response.data as GetRequestResponse;
    },

    create: async (data: CreateRequestFormState): Promise<void> => {
        const formData = new FormData();

        formData.append('Theme', data.theme);
        formData.append('Priority', data.priority.toString());
        formData.append('Message.Text', data.messageText);

        await axiosInstance.post('/requests', formData);
    },

    assignToOperator: async (id: string): Promise<GetRequestResponse> => {
        const response = await axiosInstance.patch(`/requests/${id}`);
        return response.data as GetRequestResponse;
    }
};