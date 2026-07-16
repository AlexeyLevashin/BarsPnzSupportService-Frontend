export interface InstitutionResponse {
    id: string;
    name: string;
    inn: string;
    phoneNumber?: string | null;
    email?: string | null;
    headId?: string | null;
    headName?: string | null;
    headSurname?: string | null;
    headPatronymic?: string | null;
}

export interface CreateInstitutionRequest {
    name: string;
    inn: string;
    phoneNumber?: string | null;
    email?: string | null;
    headId?: string | null;
}

export interface CreateInstitutionResponse {
    id: string;
    name: string;
    inn: string;
    phoneNumber?: string | null;
    email?: string | null;
    headId?: string | null;
}