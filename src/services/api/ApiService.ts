/**
 * Service for interacting with the backend API
 */

import { TradeEntry, InstrumentType, Direction } from '../../models/TradeEntry';
import { User } from '../../models/User';
import { AIReflection } from '../../models/AIReflection';

// Define environment variables for development
declare const process: {
  env: {
    NODE_ENV: string;
    REACT_APP_API_URL?: string;
    REACT_APP_USE_REAL_API?: string;
  }
};

// Base URL for API requests
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Empty arrays for initial state
const emptyTrades: TradeEntry[] = [];

// Default performance metrics
const defaultPerformanceMetrics = {
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  breakEvenTrades: 0,
  winRate: 0,
  totalProfit: 0,
  totalLoss: 0,
  netProfitLoss: 0,
  profitFactor: 0,
  averageWin: 0,
  averageLoss: 0,
  largestWin: 0,
  largestLoss: 0,
  averageRRR: 0,
  averageHoldingTime: 0,
  initialBalance: 10000
};

// Default user
const defaultUser: User = {
  id: 'mock-user-id',
  email: 'demo@tradle.com',
  name: 'Demo User',
  initialBalance: 10000,
  createdAt: new Date(),
  updatedAt: new Date()
};

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL || 'http://localhost:5000/api';
  }

  /**
   * Get authentication headers with Bearer token
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      // Ensure token is properly formatted as Bearer token
      headers['Authorization'] = `Bearer ${token.replace('Bearer ', '')}`;
    }

    return headers;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    customHeaders?: HeadersInit
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Get base auth headers
      const authHeaders = this.getAuthHeaders();
      
      // Merge with custom headers, custom headers override auth headers
      const headers = {
        ...authHeaders,
        ...customHeaders,
      };

      const config: RequestInit = {
        method,
        headers,
      };

      // Add body for POST/PUT requests
      if (data && (method === 'POST' || method === 'PUT')) {
        // If data is FormData, don't set Content-Type (let browser set it)
        if (data instanceof FormData) {
          delete headers['Content-Type'];
          config.body = data;
        } else {
          config.body = JSON.stringify(data);
        }
      }

      console.log(`Making ${method} request to ${url}`, {
        headers: headers,
        hasToken: !!localStorage.getItem('token')
      });

      const response = await fetch(url, config);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          console.error('Authentication failed, clearing local storage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }

        // Handle other HTTP errors
        const errorMessage = responseData?.error || responseData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error(`API Request Error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Check if API is available and user is authenticated
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Authentication methods
  
  /**
   * User login
   */
  async login(credentials: { email: string; password: string }): Promise<{
    user: User;
    token: string;
    success: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * User registration
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    initialBalance: number;
  }): Promise<{
    user: User;
    token: string;
    success: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await this.request('/auth/logout', 'POST');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; user: User }>('/auth/refresh', 'POST');
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  // User methods
  
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userData: {
    firstName?: string;
    lastName?: string;
    initialBalance?: number;
  }): Promise<User> {
    return this.request<User>('/auth/profile', 'PUT', userData);
  }

  /**
   * Change user password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/auth/change-password', 'PUT', data);
  }

  // Trade methods
  
  /**
   * Get all trades
   * @returns Promise resolving to array of trades
   */
  async getTrades(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    instrumentName?: string;
    direction?: string;
    outcome?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.instrumentName) queryParams.append('instrumentName', params.instrumentName);
      if (params?.direction) queryParams.append('direction', params.direction);
      if (params?.outcome) queryParams.append('outcome', params.outcome);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const queryString = queryParams.toString();
      const url = queryString ? `/trades?${queryString}` : '/trades';
      
      const response = await this.request<any>(url);
      
      // Handle both old format (array) and new format (object with pagination)
      if (Array.isArray(response)) {
        // Old format - return as paginated format
        return {
          trades: response,
          total: response.length,
          page: 1,
          totalPages: 1
        };
      } else {
        // New format - return as is
        return response;
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific trade
   * @param id - Trade ID
   * @returns Promise resolving to trade data
   */
  async getTrade(id: string): Promise<TradeEntry> {
    try {
      const response = await this.request<any>(`/trades/${id}`);
      
      // Helper function to map _id to id for a single trade
      const mapTradeId = (trade: any): TradeEntry => {
        return {
          ...trade,
          id: trade._id || trade.id, // Use _id if available, fallback to id
          _id: trade._id // Keep _id for API calls that need it
        };
      };
      
      // If the response is a TradeEntry object, map it and return
      if (response && (response.id || response._id)) {
        return mapTradeId(response);
      }
      
      // If the response is an object with a 'data' property, map that
      if (response && response.data && (response.data.id || response.data._id)) {
        return mapTradeId(response.data);
      }
      
      // Otherwise, throw an error
      throw new Error('Trade not found');
    } catch (error) {
      console.error('Error fetching trade:', error);
      throw error;
    }
  }
  
  /**
   * Create a new trade
   * @param tradeData - Trade data
   * @returns Promise resolving to created trade
   */
  async createTrade(tradeData: Omit<TradeEntry, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<TradeEntry> {
    try {
      const response = await this.request<any>('/trades', 'POST', tradeData);
      
      // If the response is a TradeEntry object, return it directly
      if (response && response._id) {
        return response;
      }
      
      // If the response is an object with a 'data' property, return that
      if (response && response.data) {
        return response.data;
      }
      
      // Otherwise, throw an error
      throw new Error('Failed to create trade');
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }
  
  /**
   * Update a trade
   * @param id - Trade ID
   * @param tradeData - Updated trade data
   * @returns Promise resolving to updated trade
   */
  async updateTrade(id: string, tradeData: Partial<TradeEntry>): Promise<TradeEntry> {
    try {
      const response = await this.request<any>(`/trades/${id}`, 'PUT', tradeData);
      
      // If the response is a TradeEntry object, return it directly
      if (response && (response._id || response.id)) {
        return response;
      }
      
      // If the response is an object with a 'data' property, return that
      if (response && response.data) {
        return response.data;
      }
      
      // Otherwise, throw an error
      throw new Error('Failed to update trade');
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  }
  
  /**
   * Delete a trade
   * @param id - Trade ID
   * @returns Promise resolving to success status
   */
  async deleteTrade(id: string): Promise<{ success: boolean }> {
    try {
      const response = await this.request<any>(`/trades/${id}`, 'DELETE');
      
      // If the response already has a success property, return it
      if (response && typeof response.success === 'boolean') {
        return response;
      }
      
      // If the response has a data property with success, return that
      if (response && response.data && typeof response.data.success === 'boolean') {
        return { success: response.data.success };
      }
      
      // Otherwise, assume success if we got here
      return { success: true };
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  }
  
  /**
   * Upload an image
   * @param file - Image file
   * @returns Promise resolving to image URL
   */
  async uploadImage(file: File): Promise<string> {
    // If using mock data, return a data URL
    if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_REAL_API) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('image', file);
    
    // Upload to server
    const url = `${API_BASE_URL}/trades/upload`;
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Image upload failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.imageUrl;
  }
  
  /**
   * Get performance metrics summary
   * @returns Promise resolving to performance metrics
   */
  async getPerformanceMetrics(): Promise<typeof defaultPerformanceMetrics> {
    try {
      const response = await this.request<any>('/metrics/summary');
      
      // If the response is a metrics object, return it directly
      if (response && typeof response.totalTrades === 'number') {
        return response;
      }
      
      // If the response is an object with a 'data' property, return that
      if (response && response.data && typeof response.data.totalTrades === 'number') {
        return response.data;
      }
      
      // Otherwise, return default metrics as a fallback
      console.error('Unexpected response format from /metrics/summary endpoint:', response);
      return { ...defaultPerformanceMetrics };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return { ...defaultPerformanceMetrics };
    }
  }
  
  /**
   * Get performance metrics over time
   * @param period - Time period (daily, weekly, monthly)
   * @returns Promise resolving to performance data array
   */
  async getPerformanceOverTime(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<Array<{
    period: string;
    trades: number;
    winRate: number;
    profitLoss: number;
    cumulativeProfitLoss: number;
  }>> {
    try {
      const response = await this.request<any>(`/metrics/performance?period=${period}`);
      
      // If the response is an array, return it directly
      if (Array.isArray(response)) {
        return response;
      }
      
      // If the response is an object with a 'data' property that is an array, return that
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // Otherwise, return an empty array as a fallback
      console.error('Unexpected response format from /metrics/performance endpoint:', response);
      return [];
    } catch (error) {
      console.error('Error fetching performance over time:', error);
      return [];
    }
  }
  
  /**
   * Get metrics by instrument
   * @returns Promise resolving to instrument metrics array
   */
  async getInstrumentMetrics(): Promise<Array<{
    instrumentType: string;
    instrumentName: string;
    trades: number;
    winRate: number;
    profitLoss: number;
    profitFactor: number;
    averageRRR: number;
  }>> {
    try {
      const response = await this.request<any>('/metrics/instruments');
      
      // If the response is an array, return it directly
      if (Array.isArray(response)) {
        return response;
      }
      
      // If the response is an object with a 'data' property that is an array, return that
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // Otherwise, return an empty array as a fallback
      console.error('Unexpected response format from /metrics/instruments endpoint:', response);
      return [];
    } catch (error) {
      console.error('Error fetching instrument metrics:', error);
      return [];
    }
  }
  
  /**
   * Analyze a trade chart image
   * @param file - Image file
   * @returns Promise resolving to analysis result
   */
  async analyzeTradeImage(file: File): Promise<{
    imageUrl: string;
    analysis: string;
  }> {
    // If using mock data, return mock analysis
    if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_REAL_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            imageUrl: URL.createObjectURL(file),
            analysis: `
              Chart Analysis:
              
              Instrument: Appears to be a forex pair or cryptocurrency chart
              Timeframe: Likely 1-hour or 4-hour chart
              
              Trend Analysis:
              - The overall trend appears to be bullish in the short term
              - Price is trading above the 20-period moving average
              - There's a series of higher highs and higher lows forming
              
              Key Levels:
              - Support: There's a strong support level around the recent swing low
              - Resistance: A key resistance level is visible at the recent swing high
              - The price recently broke above a previous resistance level, which may now act as support
              
              Pattern Recognition:
              - A bullish flag pattern appears to have formed recently
              - Volume is increasing on upward moves, confirming the bullish momentum
              
              Trade Setup:
              - Entry: A potential entry would be on a pullback to the newly formed support
              - Stop Loss: Below the most recent swing low
              - Take Profit: The next resistance level or a 1:2 risk-reward ratio
            `
          });
        }, 1000);
      });
    }
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('image', file);
    
    // Upload to server for analysis
    const url = `${API_BASE_URL}/analysis/image`;
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Image analysis failed with status ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Extract trade data from image
   * @param file - Image file
   * @returns Promise resolving to extracted trade data
   */
  async extractTradeData(file: File): Promise<{
    imageUrl: string;
    extractedData: Partial<TradeEntry>;
  }> {
    // If using mock data, return mock extracted data
    if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_REAL_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            imageUrl: URL.createObjectURL(file),
            extractedData: {
              instrumentType: 'FOREX' as InstrumentType,
              instrumentName: 'EUR/USD',
              direction: 'LONG' as Direction,
              entryPrice: 1.0850,
              exitPrice: 1.0920,
              stopLoss: 1.0820,
              takeProfit: 1.0950,
              profitLoss: 70,
              profitLossPercentage: 0.65,
              riskRewardRatio: 2.33
            }
          });
        }, 1000);
      });
    }
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('image', file);
    
    // Upload to server for extraction
    const url = `${API_BASE_URL}/analysis/extract`;
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Data extraction failed with status ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Generate AI insights for a trade
   * @param tradeId - Trade ID
   * @returns Promise resolving to insights and updated trade
   */
  async generateTradeInsights(tradeId: string): Promise<{
    insights: string;
    trade: TradeEntry;
  }> {
    return this.request<{
      insights: string;
      trade: TradeEntry;
    }>(`/analysis/trade/${tradeId}`, 'POST');
  }
  
  /**
   * Get AI reflection for a trade
   * @param tradeId - Trade ID (the _id of the trade)
   * @returns Promise resolving to AI reflection
   */
  async getTradeReflection(tradeId: string): Promise<AIReflection> {
    try {
      const response = await this.request<any>(`/trades/${tradeId}/reflection`);
      
      // Handle the response structure
      if (response && response.data) {
        return response.data;
      } else if (response) {
        return response;
      } else {
        throw new Error('No reflection data received');
      }
    } catch (error) {
      console.error('Error fetching trade reflection:', error);
      throw error;
    }
  }
  
  /**
   * Generate AI reflection for a trade
   * @param tradeId - Trade ID
   * @param force - Force regeneration even if reflection exists
   * @returns Promise resolving to AI reflection
   */
  async generateTradeReflection(tradeId: string, force: boolean = false): Promise<AIReflection> {
    return this.request<AIReflection>(`/reflection/generate/${tradeId}${force ? '?force=true' : ''}`, 'POST');
  }
  
  /**
   * Analyze trading performance
   * @returns Promise resolving to performance analysis
   */
  async analyzePerformance(): Promise<{
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    try {
      const response = await this.request<any>('/analysis/performance', 'POST');
      
      // If the response has the expected format, return it directly
      if (response && 
          typeof response.analysis === 'string' && 
          Array.isArray(response.strengths) && 
          Array.isArray(response.weaknesses) && 
          Array.isArray(response.recommendations)) {
        return {
          analysis: response.analysis,
          strengths: response.strengths,
          weaknesses: response.weaknesses,
          recommendations: response.recommendations
        };
      }
      
      // If the response has a data property with the expected format
      if (response && response.data && 
          typeof response.data.analysis === 'string' && 
          Array.isArray(response.data.strengths) && 
          Array.isArray(response.data.weaknesses) && 
          Array.isArray(response.data.recommendations)) {
        return {
          analysis: response.data.analysis,
          strengths: response.data.strengths,
          weaknesses: response.data.weaknesses,
          recommendations: response.data.recommendations
        };
      }
      
      // Otherwise, throw an error
      throw new Error('Unexpected response format from /analysis/performance endpoint');
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiService = new ApiService();
