export interface NotificationEntry {
  entry_id: number;
  notification_id?: number | null;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  channel?: string | null;
  scope?: string | null;
  target_id?: number | null;
  related_type?: string | null;
  related_id?: number | null;
  metadata?: Record<string, any> | null;
  is_read: boolean;
  delivered: boolean;
  read_at?: string | null;
  delivered_at?: string | null;
  created_at?: string | null;
}

export interface MarkReadRequest {
  ids: number[];
}

export interface MarkReadResponse {
  updated: number;
}

export default NotificationEntry;
