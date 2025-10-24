/**
 * API Service
 * 
 * Centralized API client for making HTTP requests
 */

class ApiService {
  private baseUrl: string;
  private getAccessToken: (() => Promise<string>) | null = null;
  private signOut: (() => Promise<void>) | null = null;

  constructor() {
    // Use /api proxy in development, or configured URL in production
    const isDevelopment = import.meta.env.DEV;
    this.baseUrl = isDevelopment ? '/api' : (window.configs?.API_BASE_URL || 'http://localhost:9090');
  }

  /**
   * Set the access token getter function
   */
  setTokenGetter(getter: () => Promise<string>) {
    this.getAccessToken = getter;
  }

  /**
   * Set the sign out function
   */
  setSignOut(signOutFn: () => Promise<void> | Promise<boolean>) {
    this.signOut = async () => {
      await signOutFn();
    };
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Get the access token from Asgardeo
      const token = this.getAccessToken ? await this.getAccessToken() : null;

      if (!token) {
        // Sign out user if no token is available
        if (this.signOut) {
          await this.signOut();
        }
        throw new Error('Session expired. Please sign in again.');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Add token as x-jwt-assertion header (required by backend)
      headers['x-jwt-assertion'] = token;

      console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
      console.log('Token :', token);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || 'Request failed');
      }

      // Handle empty responses (204 No Content or empty body)
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType?.includes('application/json')) {
        return undefined as T;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async uploadFile(file: File): Promise<{ url: string }> {
    try {
      console.log('uploadFile called, getAccessToken exists?', !!this.getAccessToken);
      
      let token: string | null = null;
      try {
        token = this.getAccessToken ? await this.getAccessToken() : null;
      } catch (error) {
        console.error('Error getting access token:', error);
        token = null;
      }
      
      console.log('Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null/empty');

      if (!token || token.trim() === '') {
        console.error('No valid token available for upload');
        if (this.signOut) {
          await this.signOut();
        }
        throw new Error('Session expired. Please sign in again.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {
        'x-jwt-assertion': token,
        // Don't set Content-Type for FormData - browser will set it with boundary
      };

      const response = await fetch(`${this.baseUrl}/upload?fileName=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers,
        body: file, // Send file directly as binary
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        console.warn('Authentication failed. Logging out...');
        if (this.signOut) {
          await this.signOut();
        }
        throw new Error('Session expired. Please sign in again.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
