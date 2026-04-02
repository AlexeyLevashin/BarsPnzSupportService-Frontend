import type { LoginRequest } from "../types/auth.types";
import { UserRole } from "../types/user.types";
export declare const authService: {
    login: (credentials: LoginRequest) => Promise<import("../types/auth.types").LoginSuccessResponse>;
    logout: () => void;
    getCurrentUser: () => {
        id: any;
        email: any;
        role: UserRole;
        institutionId: any;
    } | null;
};
//# sourceMappingURL=auth.service.d.ts.map