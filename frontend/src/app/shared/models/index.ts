export type { NotificationType, NotificationModel } from "./notification";

export interface ApiErrorResponse {
  readonly statusCode: number;
  readonly message: string | string[];
  readonly error: string;
}
export type { ModalDataModel } from './modal';
