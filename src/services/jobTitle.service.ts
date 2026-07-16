import { jobTitleApi } from '../api/jobTitle.api';
import type { CreateJobTitleRequest } from '../types/jobTitle.types';

export const jobTitleService = {
    getAll: async () => {
        return await jobTitleApi.getAll();
    },

    create: async (data: CreateJobTitleRequest) => {
        return await jobTitleApi.create(data);
    }
};
