/**
 * API Configuration & HTTP Client
 * Central file for managing HTTP requests with authentication
 */

export const API_BASE_URL = 'http://localhost:8000';

/**
 * Get the stored auth token
 */
export const getToken = (): string | null => {
    return localStorage.getItem('access_token');
};

/**
 * Set the auth token
 */
export const setToken = (token: string): void => {
    localStorage.setItem('access_token', token);
};

/**
 * Clear the auth token
 */
export const clearToken = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
};

/**
 * Redirect to login page
 */
const redirectToLogin = (): void => {
    clearToken();
    window.location.href = '/';
};

/**
 * Fetch with authentication header
 * Automatically adds Bearer token and handles 401 errors
 */
export const fetchWithAuth = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = getToken();

    const headers: HeadersInit = {
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
        redirectToLogin();
        throw new Error('Unauthorized - Please login again');
    }

    return response;
};

/**
 * POST request with form-urlencoded data (for OAuth2)
 */
export const postFormData = async (
    endpoint: string,
    data: Record<string, string>
): Promise<Response> => {
    const formBody = new URLSearchParams(data).toString();

    return fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
    });
};

/**
 * GET request with auth
 */
export const apiGet = async <T>(endpoint: string): Promise<T> => {
    const response = await fetchWithAuth(endpoint, { method: 'GET' });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
};

/**
 * POST request with auth (JSON body)
 */
export const apiPost = async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
};

/**
 * POST request with FormData (multipart)
 */
export const apiPostFormData = async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
};

/**
 * PUT request with FormData (multipart)
 */
export const apiPutFormData = async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const response = await fetchWithAuth(endpoint, {
        method: 'PUT',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
};


/**
 * Get full URL for static files (uploaded images)
 */
export const getStaticUrl = (path: string): string => {
    if (!path) return '';
    // If already a full URL, return as-is
    if (path.startsWith('http')) return path;
    // Prepend API base URL
    return `${API_BASE_URL}/static/${path}`;
};
