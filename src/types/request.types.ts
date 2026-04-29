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

    operatorId?: string | null;
    operatorFullName?: string | null;

    status: RequestStatus;
    priority: Priority;
}

export interface CreateRequestFormState {
    theme: string;
    priority: Priority;
    messageText: string;
}