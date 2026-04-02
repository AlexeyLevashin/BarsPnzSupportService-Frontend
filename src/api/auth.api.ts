import { axiosInstance } from './axiosInstance';
import type { LoginRequest, LoginSuccessResponse } from "../types/auth.types";

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginSuccessResponse> => {
        const response = await axiosInstance.post('/auth/login', credentials);
        return response.data;
    }
};