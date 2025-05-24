import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, User, LoginCredentials, RegisterCredentials, AuthResponse } from '../models/User';

// Define action types
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthResponse }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: AuthResponse }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Create context
const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
}>({
  state: initialState,
  login: async () => {},
  register: async () => {},
  updateUser: () => {},
  logout: () => {},
});

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user, token } 
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Import apiService here to avoid circular dependencies
      const { apiService } = await import('../services/api/ApiService');
      
      // Test account for development
      if (credentials.email === 'admin@admin.com' && credentials.password === 'admin') {
        const adminUser: User = {
          id: 'admin',
          email: 'admin@admin.com',
          name: 'Admin User',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
        };
        
        const adminToken = 'admin-jwt-token';
        
        // Store in localStorage
        localStorage.setItem('token', adminToken);
        localStorage.setItem('user', JSON.stringify(adminUser));
        
        // Also set in apiService
        apiService.setToken(adminToken);
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user: adminUser, token: adminToken } 
        });
        return;
      }
      
      // Make actual API call to login
      const response = await apiService.login(credentials.email, credentials.password);
      
      // Store in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: response
      });
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: 'Invalid credentials. Please try again.' 
      });
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'REGISTER_START' });
    
    try {
      // Import apiService here to avoid circular dependencies
      const { apiService } = await import('../services/api/ApiService');
      
      // Make actual API call to register
      const registerUser = await apiService.register(
        credentials.email, 
        credentials.password, 
        credentials.name,
        credentials.initialBalance
      );
      
      // Store in localStorage
      localStorage.setItem('token', registerUser.token);
      localStorage.setItem('user', JSON.stringify(registerUser.user));
      
      dispatch({ 
        type: 'REGISTER_SUCCESS', 
        payload: registerUser
      });
    } catch (error) {
      dispatch({ 
        type: 'REGISTER_FAILURE', 
        payload: 'Registration failed. Please try again.' 
      });
    }
  };

  // Logout function
  const logout = () => {
    // Import apiService here to avoid circular dependencies
    import('../services/api/ApiService').then(({ apiService }) => {
      apiService.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    });
  };

  // Update user function
  const updateUser = (user: User) => {
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update state
    dispatch({ 
      type: 'UPDATE_USER', 
      payload: user 
    });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
