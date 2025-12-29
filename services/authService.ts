/**
 * Authentication Service
 * Handles login, logout, and user session management
 */

import { postFormData, apiGet, setToken, clearToken, getToken } from './api';

export interface User {
    id: number;
    email: string;
    role: 'admin' | 'manager';
    company: string;
    region: string | null;
    group_access: string | null;
}

export interface LoginResult {
    success: boolean;
    user?: User;
    error?: string;
}

/**
 * Login with email and password
 * - POST to /token with form-data
 * - On success: Save token and fetch user details
 */
export const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
        // Step 1: Get token
        const tokenResponse = await postFormData('/token', {
            username: email,  // OAuth2 uses 'username' field
            password: password,
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json().catch(() => ({ detail: 'Login failed' }));
            return {
                success: false,
                error: error.detail || 'Invalid email or password',
            };
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Step 2: Save token
        setToken(accessToken);

        // Step 3: Fetch user details
        const user = await apiGet<User>('/users/me');

        // Step 4: Save user to localStorage
        localStorage.setItem('user', JSON.stringify(user));

        return {
            success: true,
            user,
        };

    } catch (error: any) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.message || 'Connection failed. Is the server running?',
        };
    }
};

/**
 * Logout - Clear all stored data
 */
export const logout = (): void => {
    clearToken();
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): User | null => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = (): boolean => {
    return !!getToken() && !!getCurrentUser();
};

/**
 * Check if current user is admin
 */
export const isAdmin = (): boolean => {
    const user = getCurrentUser();
    return user?.role === 'admin';
};
