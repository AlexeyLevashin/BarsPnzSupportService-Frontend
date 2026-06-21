// types/message.types.ts
import { RequestStatus } from './request.types';

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
    attachments?: { id: string; fileName: string }[];
}

export interface CreateMessageDto {
    text?: string;
    type: MessageType;
    status: RequestStatus;
    attachmentIds?: string[];
}