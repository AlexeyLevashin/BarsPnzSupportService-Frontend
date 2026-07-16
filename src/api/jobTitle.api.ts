import { axiosInstance } from './axiosInstance';
import type { CreateJobTitleRequest, GetJobTitleResponse } from '../types/jobTitle.types';

export const jobTitleApi = {
    getAll: async (): Promise<GetJobTitleResponse[]> => {
        const response = await axiosInstance.get('/job-titles');
        return response.data as GetJobTitleResponse[];
    },

    create: async (data: CreateJobTitleRequest): Promise<GetJobTitleResponse> => {
        const response = await axiosInstance.post('/job-titles', data);
        return response.data as GetJobTitleResponse;
    }
};
