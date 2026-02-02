import { loadCredentials, saveCredentials } from "../auth/storage";
import type {
  ApiResponse,
  AkiflowCredentials,
  CreateTaskPayload,
  Label,
  Tag,
  Task,
  TimeSlot,
  TokenRefreshResponse,
  UpdateTaskPayload,
} from "./types";
import { AuthError, NetworkError } from "./types";

const BASE_URL = "https://api.akiflow.com";
const REFRESH_URL = "https://web.akiflow.com/oauth/refreshToken";
const WEB_CLIENT_ID = "10";
const DEFAULT_VERSION = "3";
const DEFAULT_PLATFORM = "web";
const DEFAULT_LIMIT = 2500;

export interface AkiflowClientOptions {
  credentials?: AkiflowCredentials;
  version?: string;
  platform?: string;
}

export class AkiflowClient {
  private credentials: AkiflowCredentials | null = null;
  private version: string;
  private platform: string;
  private isRefreshing = false;

  constructor(options: AkiflowClientOptions = {}) {
    this.credentials = options.credentials ?? null;
    this.version = options.version ?? DEFAULT_VERSION;
    this.platform = options.platform ?? DEFAULT_PLATFORM;
  }

  private async getCredentials(): Promise<AkiflowCredentials> {
    if (this.credentials) {
      return this.credentials;
    }

    const stored = await loadCredentials();
    if (!stored) {
      throw new AuthError("No credentials found. Please login first.");
    }

    this.credentials = {
      token: stored.token,
      clientId: stored.clientId,
      refreshToken: stored.refreshToken,
    };

    return this.credentials;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return false;
    }

    const creds = await this.getCredentials();
    if (!creds.refreshToken) {
      return false;
    }

    this.isRefreshing = true;
    try {
      const response = await fetch(REFRESH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: WEB_CLIENT_ID,
          refresh_token: creds.refreshToken,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as TokenRefreshResponse;
      if (!data.access_token || !data.refresh_token) {
        return false;
      }

      const expiryTimestamp = Date.now() + data.expires_in * 1000;

      await saveCredentials(
        data.access_token,
        creds.clientId,
        expiryTimestamp,
        data.refresh_token
      );

      this.credentials = {
        token: data.access_token,
        clientId: creds.clientId,
        refreshToken: data.refresh_token,
      };

      return true;
    } catch {
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async buildHeaders(
    includeContentType = false
  ): Promise<Record<string, string>> {
    const creds = await this.getCredentials();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${creds.token}`,
      "Akiflow-Client-Id": creds.clientId,
      "Akiflow-Version": this.version,
      "Akiflow-Platform": this.platform,
      Accept: "application/json",
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  private async request<TData>(
    method: "GET" | "PATCH",
    path: string,
    body?: unknown,
    retried = false
  ): Promise<ApiResponse<TData>> {
    const url = `${BASE_URL}${path}`;
    const headers = await this.buildHeaders(method === "PATCH");

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      throw new NetworkError(
        "Failed to connect to Akiflow API",
        error instanceof Error ? error : undefined
      );
    }

    if (response.status === 401 && !retried) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request<TData>(method, path, body, true);
      }
      throw new AuthError(
        "Authentication failed. Token expired and refresh failed. Please run 'af auth' to re-authenticate."
      );
    }

    if (response.status === 401) {
      throw new AuthError(
        "Authentication failed. Please run 'af auth' to re-authenticate."
      );
    }

    if (!response.ok) {
      throw new NetworkError(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    try {
      return (await response.json()) as ApiResponse<TData>;
    } catch (error) {
      throw new NetworkError(
        "Failed to parse API response",
        error instanceof Error ? error : undefined
      );
    }
  }

  async getTasks(options: { limit?: number; syncToken?: string } = {}): Promise<
    ApiResponse<Task[]>
  > {
    const params = new URLSearchParams();
    params.set("limit", String(options.limit ?? DEFAULT_LIMIT));

    if (options.syncToken) {
      params.set("sync_token", options.syncToken);
    }

    return this.request<Task[]>("GET", `/v5/tasks?${params.toString()}`);
  }

  async upsertTasks(
    tasks: Array<CreateTaskPayload | UpdateTaskPayload>
  ): Promise<ApiResponse<Task[]>> {
    return this.request<Task[]>("PATCH", "/v5/tasks", tasks);
  }

  async getLabels(options: { limit?: number; syncToken?: string } = {}): Promise<
    ApiResponse<Label[]>
  > {
    const params = new URLSearchParams();
    params.set("limit", String(options.limit ?? DEFAULT_LIMIT));

    if (options.syncToken) {
      params.set("sync_token", options.syncToken);
    }

    return this.request<Label[]>("GET", `/v5/labels?${params.toString()}`);
  }

  async getTags(options: { limit?: number; syncToken?: string } = {}): Promise<
    ApiResponse<Tag[]>
  > {
    const params = new URLSearchParams();
    params.set("limit", String(options.limit ?? DEFAULT_LIMIT));

    if (options.syncToken) {
      params.set("sync_token", options.syncToken);
    }

    return this.request<Tag[]>("GET", `/v5/tags?${params.toString()}`);
  }

  async getTimeSlots(options: {
    limit?: number;
    syncToken?: string;
  } = {}): Promise<ApiResponse<TimeSlot[]>> {
    const params = new URLSearchParams();
    params.set("limit", String(options.limit ?? DEFAULT_LIMIT));

    if (options.syncToken) {
      params.set("sync_token", options.syncToken);
    }

    return this.request<TimeSlot[]>(
      "GET",
      `/v5/time_slots?${params.toString()}`
    );
  }
}

export function createClient(
  options: AkiflowClientOptions = {}
): AkiflowClient {
  return new AkiflowClient(options);
}
