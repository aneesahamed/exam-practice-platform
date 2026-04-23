/**
 * API Client Configuration
 * 
 * Fetch wrapper for backend API calls with JWT authentication
 */

import { fetchAuthSession } from 'aws-amplify/auth';

// Get API base URL from environment variable
// Falls back to localhost for development if not set
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Log the API URL being used (helps with debugging)
console.log('🔗 API Base URL:', API_BASE_URL);

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get the current user's ID token from Cognito
 */
async function getIdToken(): Promise<string | undefined> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  } catch (err) {
    console.log('No auth session available');
    return undefined;
  }
}

/**
 * Generic fetch wrapper with error handling and automatic JWT injection
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if user is authenticated
  const idToken = await getIdToken();
  if (idToken) {
    defaultHeaders['Authorization'] = `Bearer ${idToken}`;
  } else if (requireAuth) {
    throw new ApiError('Authentication required', 401);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or other issues
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

/**
 * Health check endpoint
 */
export async function healthCheck() {
  return apiRequest<{
    status: string;
    service: string;
    version: string;
    timestamp: string;
  }>('/health');
}
