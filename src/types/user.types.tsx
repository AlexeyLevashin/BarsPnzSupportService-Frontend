export enum UserRole {
    User = 0,
    Operator = 1,
    UserAdmin = 2,
    SuperAdmin = 3
}

export interface CreateUserByAdminRequest {
    name: string;
    surname: string;
    patronymic?: string | null;
    email: string;
    role: UserRole;
    institutionId?: string | null;
}

export interface CreateUserResponse {
    id: string;
    name: string;
    surname: string;
    patronymic?: string | null;
    email: string;
    initialPassword: string;
    role: UserRole;
    institutionId?: string | null;
}

export interface GetUserResponse {
    id: string;
    name: string;
    surname: string;
    patronymic?: string | null;
    email: string;
    role: UserRole;
    institutionId?: string | null;
}