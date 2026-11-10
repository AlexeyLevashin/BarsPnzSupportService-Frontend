// api/request.api.ts
import { axiosInstance } from './axiosInstance';
import type { PagedResponse, PaginationParams } from '../types/common.types';
import type { GetRequestResponse, CreateRequestDto, CreatePhoneRequestDto, MergeRequestsDto, UpdateRequestDto, UpdateStatusDto } from '../types/request.types';

export const requestApi = {
    getAll: async (pageData: PaginationParams): Promise<PagedResponse<GetRequestResponse>> => {
        const response = await axiosInstance.get('/requests/all', { params: pageData });
        return response.data;
    },
    getMy: async (pageData: PaginationParams): Promise<PagedResponse<GetRequestResponse>> => {
        const response = await axiosInstance.get('/requests/all/my', { params: pageData });
        return response.data;
    },
    getById: async (id: string): Promise<GetRequestResponse> => {
        const response = await axiosInstance.get(`/requests/${id}`);
        return response.data;
    },
    markAsViewed: async (id: string): Promise<void> => {
        await axiosInstance.post(`/requests/${id}/view`);
    },
    create: async (data: CreateRequestDto): Promise<void> => {
        await axiosInstance.post('/requests', data);
    },
    createPhone: async (data: CreatePhoneRequestDto): Promise<void> => {
        await axiosInstance.post('/requests/phone', data);
    },
    merge: async (parentRequestId: string, data: MergeRequestsDto): Promise<GetRequestResponse> => {
        const response = await axiosInstance.post(`/requests/${parentRequestId}/merge`, data);
        return response.data;
    },
    update: async (requestId: string, data: UpdateRequestDto): Promise<GetRequestResponse> => {
        const response = await axiosInstance.put(`/requests/${requestId}`, data);
        return response.data;
    },
    assignToOperator: async (requestId: string, operatorId: string): Promise<void> => {
        await axiosInstance.post(`/requests/${requestId}/operators`, { operatorId });
    },
    changeStatus: async (requestId: string, data: UpdateStatusDto): Promise<void> => {
        await axiosInstance.patch(`/requests/${requestId}/status`, data);
    },
    removeOperator: async (requestId: string, operatorId: string): Promise<void> => {
        await axiosInstance.delete(`/requests/${requestId}/operators/${operatorId}`);
    }
};
