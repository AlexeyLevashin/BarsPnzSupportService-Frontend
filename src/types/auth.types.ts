export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginSuccessResponse {
    accessToken?: string;
    refreshToken?: string;
    requiresTwoFactor?: boolean;
    twoFactorToken?: string;
}
export interface PasswordResetRequest { email: string; }
export interface VerifyPasswordResetRequest extends PasswordResetRequest { code: string; }
export interface VerifyPasswordResetResponse { resetToken: string; }
export interface ConfirmPasswordResetRequest {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
}
export interface TwoFactorStatusResponse { isEnabled: boolean; }
export interface EnableTwoFactorResponse { secret: string; otpAuthUri: string; }
export interface ConfirmTwoFactorRequest { code: string; }
export interface ConfirmTwoFactorResponse { recoveryCodes: string[]; }
export interface VerifyTwoFactorRequest { twoFactorToken: string; code: string; }
