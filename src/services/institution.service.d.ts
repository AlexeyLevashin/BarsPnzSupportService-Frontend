import type { CreateInstitutionRequest } from '../types/institution.types';
import type { PaginationParams } from '../types/common.types';
export declare const institutionService: {
    getAll: (pageData: PaginationParams) => Promise<import("../types/common.types").PagedResponse<import("../types/institution.types").InstitutionResponse>>;
    getById: (id: string) => Promise<import("../types/institution.types").InstitutionResponse>;
    getMy: () => Promise<import("../types/institution.types").InstitutionResponse>;
    create: (data: CreateInstitutionRequest) => Promise<import("../types/institution.types").InstitutionResponse>;
    update: (id: string, data: CreateInstitutionRequest) => Promise<import("../types/institution.types").InstitutionResponse>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=institution.service.d.ts.map