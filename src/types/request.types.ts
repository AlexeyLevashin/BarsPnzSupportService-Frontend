// types/request.types.ts
export enum Priority {
    Normal = 'Normal',
    High = 'High',
    Emergency = 'Emergency'
}

export enum RequestType {
    System = 'System',
    Email = 'Email',
    Phone = 'Phone'
}

export enum RequestStatus {
    New = 'New',
    InProgress = 'InProgress',
    ClientDataRequest = 'ClientDataRequest',
    PendingReview = 'PendingReview',
    Closed = 'Closed',
    Canceled = 'Canceled',
    Analysis = 'Analysis'
}

export interface GetRequestResponse {
    id: string;
    theme: string;
    createdAt: string;
    closedAt?: string | null;
    clientId: string;
    clientFullName: string;
    institutionId?: string | null;
    institutionName?: string | null;
    operators?: { id: string; operatorFullName: string }[];
    status: RequestStatus;
    type: RequestType;
    priority: Priority;
}

export interface CreateRequestFormState {
    theme: string;
    priority: Priority;
    type: RequestType;
    messageText: string;
    attachmentIds?: string[];
    institutionId?: string | null;
}

export interface CreateRequestDto {
    theme: string;
    priority: Priority;
    type: RequestType;
    message: {
        text: string;
        attachmentIds?: string[];
    };
    institutionId?: string | null;
}

export interface UpdateStatusDto {
    status: RequestStatus;
}
