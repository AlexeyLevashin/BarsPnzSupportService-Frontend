export enum UserRole {
    User = 'User',
    Operator = 'Operator',
    UserAdmin = 'UserAdmin',
    SuperAdmin = 'SuperAdmin'
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