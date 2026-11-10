import { axiosInstance } from './axiosInstance';
import type { LoginRequest, LoginSuccessResponse, PasswordResetRequest, VerifyPasswordResetRequest, VerifyPasswordResetResponse, ConfirmPasswordResetRequest, TwoFactorStatusResponse, EnableTwoFactorResponse, ConfirmTwoFactorRequest, ConfirmTwoFactorResponse, VerifyTwoFactorRequest } from "../types/auth.types";

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
    },
    twoFactorStatus: async (): Promise<TwoFactorStatusResponse> => {
        const response = await axiosInstance.get('/auth/2fa/status');
        return response.data;
    },
    enableTwoFactor: async (): Promise<EnableTwoFactorResponse> => {
        const response = await axiosInstance.post('/auth/2fa/enable');
        return response.data;
    },
    confirmTwoFactor: async (request: ConfirmTwoFactorRequest): Promise<ConfirmTwoFactorResponse> => {
        const response = await axiosInstance.post('/auth/2fa/confirm', request);
        return response.data;
    },
    disableTwoFactor: async (request: ConfirmTwoFactorRequest): Promise<void> => {
        await axiosInstance.post('/auth/2fa/disable', request);
    },
    verifyTwoFactor: async (request: VerifyTwoFactorRequest): Promise<LoginSuccessResponse> => {
        const response = await axiosInstance.post('/auth/2fa/verify', request);
        return response.data;
    }
};