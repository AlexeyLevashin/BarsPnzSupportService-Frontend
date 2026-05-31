import { axiosInstance } from './axiosInstance';

export const fileApi = {
    upload: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.fileId;
    },

    getUrl: async (fileId: string): Promise<string> => {
        const response = await axiosInstance.get(`/files/${fileId}/url`);
        return response.data.url;
    },

    delete: async (fileId: string): Promise<void> => {
        await axiosInstance.delete(`/files/${fileId}`);
    }
};