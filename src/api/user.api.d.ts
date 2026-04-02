import type { CreateUserResponse, GetUserResponse, CreateUserByAdminRequest } from "../types/user.types";
import type { PagedResponse, PaginationParams } from "../types/common.types";
export declare const userApi: {
    getAll: (pageData: PaginationParams) => Promise<PagedResponse<GetUserResponse>>;
    getById: (id: string) => Promise<GetUserResponse>;
    create: (userData: CreateUserByAdminRequest) => Promise<CreateUserResponse>;
    update: (id: string, userData: CreateUserByAdminRequest) => Promise<CreateUserResponse>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=user.api.d.ts.map