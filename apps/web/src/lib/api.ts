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

  static async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static async post<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static async put<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static async patch<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static async delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  static async downloadFile(endpoint: string, defaultFileName: string): Promise<void> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, { credentials: 'omit', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(err.message || 'Download failed');
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    // Extract filename from header if available
    const disposition = res.headers.get('content-disposition');
    let fileName = defaultFileName;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) fileName = match[1];
    }
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}
