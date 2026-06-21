import { requestApi } from '../api/request.api';
import type { PaginationParams } from '../types/common.types';
import type { CreateRequestDto } from '../types/request.types';
import { RequestStatus } from '../types/request.types';

export const requestService = {
    getAll: async (pageData: PaginationParams) => await requestApi.getAll(pageData),
    getMy: async (pageData: PaginationParams) => await requestApi.getMy(pageData),
    create: async (data: CreateRequestDto) => await requestApi.create(data),
    getById: async (id: string) => await requestApi.getById(id),
    takeInWork: async (id: string) => await requestApi.takeInWork(id),
    assignToOperator: async (requestId: string, operatorId: string) => await requestApi.assignToOperator(requestId, operatorId),
    terminate: async (requestId: string, status: RequestStatus) => await requestApi.terminate(requestId, { status })
};