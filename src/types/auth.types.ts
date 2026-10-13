export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginSuccessResponse {
    accessToken: string;
    refreshToken: string;
}
export interface PasswordResetRequest { email: string; }
export interface VerifyPasswordResetRequest extends PasswordResetRequest { code: string; }
export interface VerifyPasswordResetResponse { resetToken: string; }
export interface ConfirmPasswordResetRequest {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
}
