import { messageApi } from '../api/message.api';
import type { PaginationParams } from '../types/common.types';
import type { CreateMessageDto } from '../types/message.types';

export const messageService = {
    getMessages: async (requestId: string, params: PaginationParams) => {
        return await messageApi.getMessages(requestId, params);
    },
    getComments: async (requestId: string, params: PaginationParams) => {
        return await messageApi.getComments(requestId, params);
    },
    create: async (requestId: string, data: CreateMessageDto) => {
        return await messageApi.create(requestId, data);
    }
};