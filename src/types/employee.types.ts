import type { UserInstitutionResponse } from './user.types';

export interface CreateEmployeeRequest {
    name: string;
    surname: string;
    patronymic?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    workplaces: { institutionId: string; jobTitleId?: string | null }[];
}

export interface GetEmployeeResponse {
    id: string;
    name: string;
    surname: string;
    patronymic?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    isUser: boolean;
    userId?: string | null;
    workplaces: UserInstitutionResponse[];
}
