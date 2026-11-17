const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: { field: string; message: string }[];
}

export class ApiClient {
  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('zentra_access_token');
  }

  static setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('zentra_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('zentra_refresh_token', refreshToken);
    }
  }

  static clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('zentra_access_token');
    localStorage.removeItem('zentra_refresh_token');
  }

  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getAccessToken();
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg =
        data.message || (data.errors ? data.errors[0]?.message : 'Request failed');
      const error: any = new Error(errorMsg);
      error.status = res.status;
      error.details = data;
      throw error;
    }

    return data as T;
  }
}
