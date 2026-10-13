import { axiosInstance } from './axiosInstance';
import type { LoginRequest, LoginSuccessResponse, PasswordResetRequest, VerifyPasswordResetRequest, VerifyPasswordResetResponse, ConfirmPasswordResetRequest } from "../types/auth.types";

export const authApi = {
    requestPasswordReset: async (request: PasswordResetRequest): Promise<void> => {
        await axiosInstance.post('/auth/password-reset/request', request);
    },
    verifyPasswordReset: async (request: VerifyPasswordResetRequest): Promise<VerifyPasswordResetResponse> => {
        const response = await axiosInstance.post('/auth/password-reset/verify', request);
        return response.data;
    },
    confirmPasswordReset: async (request: ConfirmPasswordResetRequest): Promise<void> => {
        await axiosInstance.post('/auth/password-reset/confirm', request);
    },
    login: async (credentials: LoginRequest): Promise<LoginSuccessResponse> => {
        const response = await axiosInstance.post('/auth/login', credentials);
        return response.data;
    }
};