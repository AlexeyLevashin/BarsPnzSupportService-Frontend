import { requestApi } from '../api/request.api';
import type { PaginationParams } from '../types/common.types';
import type { CreatePhoneRequestDto, CreateRequestDto, MergeRequestsDto, UpdateRequestDto } from '../types/request.types';
import { RequestStatus } from '../types/request.types';

export const requestService = {
    getAll: async (pageData: PaginationParams) => await requestApi.getAll(pageData),
    getMy: async (pageData: PaginationParams) => await requestApi.getMy(pageData),
    create: async (data: CreateRequestDto) => await requestApi.create(data),
    createPhone: async (data: CreatePhoneRequestDto) => await requestApi.createPhone(data),
    merge: async (parentRequestId: string, data: MergeRequestsDto) => await requestApi.merge(parentRequestId, data),
    update: async (requestId: string, data: UpdateRequestDto) => await requestApi.update(requestId, data),
    getById: async (id: string) => await requestApi.getById(id),
    markAsViewed: async (id: string) => await requestApi.markAsViewed(id),
    assignToOperator: async (requestId: string, operatorId: string) => await requestApi.assignToOperator(requestId, operatorId),
    changeStatus: async (requestId: string, status: RequestStatus) => await requestApi.changeStatus(requestId, { status }),
    removeOperator: async (requestId: string, operatorId: string) => await requestApi.removeOperator(requestId, operatorId),
};
