import {axiosInstance} from "./axiosInstance";
import type {CreateInstitutionRequest, CreateInstitutionResponse, InstitutionResponse} from "../types/institution.types";
import type {PagedResponse, PaginationParams} from "../types/common.types";

export const institutionApi = {
    getAll: async (pageData: PaginationParams): Promise<PagedResponse<InstitutionResponse>> => {
        const response = await axiosInstance.get('/institutions', { params: pageData });
        return response.data as PagedResponse<InstitutionResponse>;
    },
    getById: async (id: string): Promise<InstitutionResponse> => {
        const response = await axiosInstance.get(`/institutions/${id}`);
        return response.data as InstitutionResponse;
    },
    // Возвращает список учреждений текущего сотрудника (many-to-many)
    getMy: async (): Promise<InstitutionResponse[]> => {
        const response = await axiosInstance.get<InstitutionResponse[]>('/institutions/my');
        return response.data;
    },
    create: async (institutionData: CreateInstitutionRequest): Promise<CreateInstitutionResponse> => {
        const response = await axiosInstance.post('/institutions', institutionData);
        return response.data as CreateInstitutionResponse;
    },
    update: async (id: string, institutionData: CreateInstitutionRequest): Promise<InstitutionResponse> => {
        const response = await axiosInstance.put(`/institutions/${id}`, institutionData);
        return response.data as InstitutionResponse;
    },
    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/institutions/${id}`);
    }
}
