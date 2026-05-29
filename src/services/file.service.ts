import { fileApi } from '../api/file.api';

export const fileService = {
    upload: async (file: File) => {
        return await fileApi.upload(file);
    },
    getUrl: async (fileId: string) => {
        return await fileApi.getUrl(fileId);
    }
};