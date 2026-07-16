export enum UserRole {
    User = 'User',
    Operator = 'Operator',
    UserAdmin = 'UserAdmin',
    SuperAdmin = 'SuperAdmin'
}

export interface UserInstitutionResponse {
    institutionId: string;
    institutionName: string;
    jobTitleId?: string | null;
    jobTitleName?: string | null;
}

export interface WorkplaceRequest {
    institutionId: string;
    jobTitleId?: string | null;
}

// Добавить пользователя к уже существующему сотруднику
export interface CreateUserByAdminRequest {
    email: string;
    role: UserRole;
}

// Создать сотрудника + пользователя одновременно
export interface CreateUserWithEmployeeRequest {
    name: string;
    surname: string;
    patronymic?: string | null;
    phoneNumber?: string | null;
    email: string;
    role: UserRole;
    workplaces: WorkplaceRequest[];
}

export interface CreateUserResponse {
    email: string;
    initialPassword: string;
}

export interface GetUserResponse {
    id: string;
    name: string;
    surname: string;
    patronymic?: string | null;
    email: string;
    phoneNumber?: string | null;
    role: UserRole;
    workplaces: UserInstitutionResponse[];
}

export interface GetOperatorResponse {
    id: string;
    operatorFullName: string;
}