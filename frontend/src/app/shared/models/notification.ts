export type NotificationType = "error" | "success" | "warning" | "info";

export interface NotificationModel {
  readonly message: string;
  readonly type: NotificationType;
}
