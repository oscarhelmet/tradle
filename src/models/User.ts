/**
 * User model and authentication related types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  lastLogin?: Date;
  initialBalance?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  initialBalance?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
