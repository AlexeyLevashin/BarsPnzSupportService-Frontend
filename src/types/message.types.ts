export enum MessageType {
    Public = 'Public',
    Internal = 'Internal'
}

export interface GetMessageResponse {
    id: string;
    requestId: string;
    text: string;
    type: MessageType;
    createdAt: string;
    senderFullName: string;
    senderId: string;
}

export interface CreateMessageDto {
    text: string;
    type: MessageType;
}