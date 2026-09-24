export interface ContactMessageModel {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly message: string;
  readonly isRead: boolean;
  readonly createdAt: string;
}

export interface ContactPayloadModel {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly message: string;
}

/** `POST /api/contact` only acknowledges; it never echoes the stored row. */
export interface ContactSubmitResponseModel {
  readonly submitted: boolean;
}

export interface PaginatedMessagesModel {
  readonly items: ContactMessageModel[];
  readonly total: number;
  readonly unreadCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
