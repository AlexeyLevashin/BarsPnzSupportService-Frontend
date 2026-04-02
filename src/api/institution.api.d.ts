import type { CreateInstitutionRequest, InstitutionResponse } from "../types/institution.types";
import type { PagedResponse, PaginationParams } from "../types/common.types";
export declare const institutionApi: {
    getAll: (pageData: PaginationParams) => Promise<PagedResponse<InstitutionResponse>>;
    getById: (id: string) => Promise<InstitutionResponse>;
    getMy: () => Promise<InstitutionResponse>;
    create: (institutionData: CreateInstitutionRequest) => Promise<InstitutionResponse>;
    update: (id: string, institutionData: CreateInstitutionRequest) => Promise<InstitutionResponse>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=institution.api.d.ts.map