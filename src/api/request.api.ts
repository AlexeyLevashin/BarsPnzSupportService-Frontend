// api/request.api.ts
import { axiosInstance } from './axiosInstance';
import type { PagedResponse, PaginationParams } from '../types/common.types';
import type { GetRequestResponse, CreateRequestDto, UpdateStatusDto } from '../types/request.types';

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
    create: async (data: CreateRequestDto): Promise<void> => {
        await axiosInstance.post('/requests', data);
    },
    takeInWork: async (id: string): Promise<void> => {
        await axiosInstance.post(`/requests/${id}/take`);
    },
    assignToOperator: async (requestId: string, operatorId: string): Promise<void> => {
        await axiosInstance.post(`/requests/${requestId}/assign`, { operatorId });
    },
    terminate: async (requestId: string, data: UpdateStatusDto): Promise<void> => {
        await axiosInstance.patch(`/requests/${requestId}/status`, data);
    }
};