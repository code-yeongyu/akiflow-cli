export class AuthError extends Error {
  constructor(message = "Authentication failed") {
    super(message);
    this.name = "AuthError";
  }
}

export class NetworkError extends Error {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = "NetworkError";
    this.originalError = originalError;
  }
}

export interface ApiResponse<TData> {
  success: boolean;
  message: string | null;
  data: TData;
  sync_token?: string;
  has_next_page?: boolean;
}

export type TaskStatus = 0 | 1 | 2 | null;

export interface Task {
  id: string;
  user_id: number;
  recurring_id: string | null;
  title: string | null;
  description: string | null;
  date: string | null;
  datetime: string | null;
  datetime_tz: string | null;
  original_date: string | null;
  original_datetime: string | null;
  duration: number | null;
  recurrence: string | null;
  recurrence_version: number | null;
  status: TaskStatus;
  priority: number | null;
  dailyGoal: number | null;
  done: boolean;
  done_at: string | null;
  read_at: string | null;
  listId: string | null;
  section_id: string | null;
  tags_ids: string[];
  sorting: number;
  sorting_label: number | null;
  origin: string | null;
  due_date: string | null;
  connector_id: string | null;
  origin_id: string | null;
  origin_account_id: string | null;
  akiflow_account_id: string | null;
  doc: Record<string, unknown>;
  calendar_id: string | null;
  time_slot_id: string | null;
  links: string[];
  content: Record<string, unknown>;
  trashed_at: string | null;
  plan_unit: string | null;
  plan_period: string | null;
  global_list_id_updated_at: string | null;
  global_tags_ids_updated_at: string | null;
  global_created_at: string;
  global_updated_at: string;
  data: Record<string, unknown>;
  deleted_at: string | null;
}

export interface CreateTaskPayload {
  id: string;
  title: string;
  global_created_at: string;
  global_updated_at: string;
  description?: string;
  date?: string;
  datetime?: string;
  datetime_tz?: string;
  duration?: number;
  priority?: number;
  dailyGoal?: number;
  listId?: string;
  section_id?: string;
  tags_ids?: string[];
  due_date?: string;
  links?: string[];
  content?: Record<string, unknown>;
  calendar_id?: string;
  status?: TaskStatus;
  recurrence?: string;
}

export interface UpdateTaskPayload {
  id: string;
  global_updated_at: string;
  title?: string;
  description?: string;
  date?: string;
  datetime?: string;
  datetime_tz?: string;
  duration?: number;
  priority?: number;
  dailyGoal?: number;
  listId?: string;
  section_id?: string;
  tags_ids?: string[];
  due_date?: string;
  links?: string[];
  content?: Record<string, unknown>;
  done?: boolean;
  done_at?: string | null;
  status?: TaskStatus;
  deleted_at?: string | null;
}

export interface Label {
  id: string;
  user_id: number;
  parent_id: string | null;
  title: string;
  icon: string | null;
  color: string | null;
  sorting: number;
  type: string | null;
  global_created_at: string;
  global_updated_at: string;
  data: Record<string, unknown>;
  deleted_at: string | null;
}

export interface Tag {
  id: string;
  user_id: number;
  title: string;
  color: string | null;
  sorting: number;
  global_created_at: string;
  global_updated_at: string;
  data: Record<string, unknown>;
  deleted_at: string | null;
}

export type TimeSlotStatus = "confirmed" | "tentative";

export interface TimeSlot {
  id: string;
  user_id: number;
  recurring_id: string | null;
  calendar_id: string;
  label_id: string | null;
  section_id: string | null;
  status: TimeSlotStatus;
  title: string;
  description: string | null;
  original_start_time: string | null;
  start_time: string;
  end_time: string;
  start_datetime_tz: string;
  recurrence: string | null;
  color: string | null;
  content: Record<string, unknown>;
  global_label_id_updated_at: string | null;
  global_created_at: string;
  global_updated_at: string;
  data: Record<string, unknown>;
  deleted_at: string | null;
}

export interface AkiflowCredentials {
  token: string;
  clientId: string;
  refreshToken?: string;
}

export interface TokenRefreshResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}
