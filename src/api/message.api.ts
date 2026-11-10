// api/message.api.ts
import { axiosInstance } from './axiosInstance';
import type { PagedResponse, PaginationParams } from '../types/common.types';
import type { GetMessageResponse, CreateMessageDto, UpdateMessageDto } from '../types/message.types';

export const messageApi = {
    getMessages: async (requestId: string, params: PaginationParams): Promise<PagedResponse<GetMessageResponse>> => {
        const response = await axiosInstance.get(`/requests/${requestId}/messages`, { params });
        return response.data;
    },
    getComments: async (requestId: string, params: PaginationParams): Promise<PagedResponse<GetMessageResponse>> => {
        const response = await axiosInstance.get(`/requests/${requestId}/comments`, { params });
        return response.data;
    },
    create: async (requestId: string, data: CreateMessageDto): Promise<void> => {
        await axiosInstance.post(`/requests/${requestId}/messages`, data);
    },
    updateMessage: async (messageId: string, data: UpdateMessageDto): Promise<GetMessageResponse> => {
        const response = await axiosInstance.patch(`/messages/${messageId}`, data);
        return response.data;
    }
};