import type { CreateUserByAdminRequest } from '../types/user.types';
import type { PaginationParams } from '../types/common.types';
export declare const userService: {
    getAll: (pageData: PaginationParams) => Promise<import("../types/common.types").PagedResponse<import("../types/user.types").GetUserResponse>>;
    getById: (id: string) => Promise<import("../types/user.types").GetUserResponse>;
    create: (userData: CreateUserByAdminRequest) => Promise<import("../types/user.types").CreateUserResponse>;
    update: (id: string, userData: CreateUserByAdminRequest) => Promise<import("../types/user.types").CreateUserResponse>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=user.service.d.ts.map