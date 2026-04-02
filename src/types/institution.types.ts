export interface InstitutionResponse {
    id: string;
    name: string;
    inn: string;
    headName?: string | null;
    headSurname?: string | null;
    headPatronymic?: string | null;
}

export interface CreateInstitutionRequest {
    name: string;
    inn: string;
    headName?: string | null;
    headSurname?: string | null;
    headPatronymic?: string | null;
}