// types/request.types.ts
export enum Priority {
    Normal = 'Normal',
    High = 'High',
    Emergency = 'Emergency'
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
    institutionName?: string | null;

    operators?: { id: string; operatorFullName: string }[];

    status: RequestStatus;
    priority: Priority;
}

export interface CreateRequestFormState {
    theme: string;
    priority: Priority;
    messageText: string;
    attachmentIds?: string[];
}

export interface CreateRequestDto {
    theme: string;
    priority: Priority;
    message: {
        text: string;
        attachmentIds?: string[];
    };
}

export interface UpdateStatusDto {
    status: RequestStatus;
}