export enum Priority {
    Normal = 0,
    High = 1,
    Emergency = 2
}

export enum RequestStatus {
    New = 0,
    InProgress = 1,
    ClientDataRequest = 2,
    PendingReview = 3,
    Closed = 4,
    Canceled = 5
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