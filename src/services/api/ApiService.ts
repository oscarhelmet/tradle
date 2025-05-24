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
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  private token: string | null = null;
  
  /**
   * Set the authentication token
   * @param token - JWT token
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }
  
  /**
   * Get the authentication token
   * @returns The JWT token or null if not authenticated
   */
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }
  
  /**
   * Clear the authentication token
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }
  
  /**
   * Create headers for API requests
   * @returns Headers object with authorization token if available
   */
  private createHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
  
  /**
   * Make a request to the API
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @param body - Request body
   * @returns Promise resolving to response data
   */
  private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    // For development, return mock data
    if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_REAL_API) {
      return this.getMockData<T>(endpoint, method, body);
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.createHeaders(),
      body: body ? JSON.stringify(body) : undefined
    };
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
  
  /**
   * Get mock data for development
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @param body - Request body
   * @returns Mock data for the request
   */
  private getMockData<T>(endpoint: string, method: string, body?: any): Promise<T> {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Auth endpoints
        if (endpoint === '/auth/login') {
          resolve({
            user: defaultUser,
            token: 'mock-jwt-token'
          } as unknown as T);
          return;
        }
        
        if (endpoint === '/auth/register') {
          resolve({
            user: defaultUser,
            token: 'mock-jwt-token'
          } as unknown as T);
          return;
        }
        
        if (endpoint === '/auth/me') {
          resolve(defaultUser as unknown as T);
          return;
        }
        
        // Trades endpoints
        if (endpoint === '/trades' && method === 'GET') {
          resolve(emptyTrades as unknown as T);
          return;
        }
        
        if (endpoint.match(/\/trades\/[\w-]+$/) && method === 'GET') {
          // Since we have no mock trades, return a not found error
          throw new Error('Trade not found');
        }
        
        if (endpoint === '/trades' && method === 'POST') {
          const newTrade = {
            ...body,
            id: Math.random().toString(36).substring(2, 15),
            userId: defaultUser.id || '1',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          resolve(newTrade as unknown as T);
          return;
        }
        
        if (endpoint.match(/\/trades\/[\w-]+$/) && method === 'PUT') {
          const id = endpoint.split('/').pop();
          const updatedTrade = {
            ...body,
            id,
            updatedAt: new Date()
          };
          
          resolve(updatedTrade as unknown as T);
          return;
        }
        
        if (endpoint.match(/\/trades\/[\w-]+$/) && method === 'DELETE') {
          resolve({ success: true } as unknown as T);
          return;
        }
        
        // Performance metrics
        if (endpoint === '/metrics/performance') {
          resolve(defaultPerformanceMetrics as unknown as T);
          return;
        }
        
        // Performance analysis
        if (endpoint === '/analysis/performance' && method === 'POST') {
          resolve({
            analysis: 'Based on your trading history, you are just starting your trading journey. Since you have no trades recorded yet, this analysis will provide general guidance for new traders. Focus on developing a solid trading plan, practicing risk management, and maintaining detailed records of all your trades.',
            strengths: [
              'You are taking the right approach by using a trading journal',
              'Starting with proper tracking and analysis tools',
              'Commitment to learning and improvement'
            ],
            weaknesses: [
              'No trading history to analyze yet',
              'Need to establish consistent trading patterns',
              'Risk management strategies need to be developed'
            ],
            recommendations: [
              'Start with a demo account to practice your strategies',
              'Develop a clear trading plan with entry and exit rules',
              'Focus on risk management - never risk more than 1-2% per trade',
              'Keep detailed notes on each trade to identify patterns',
              'Study market analysis and technical indicators',
              'Set realistic profit targets and stick to your plan'
            ]
          } as unknown as T);
          return;
        }
        
        // Reflection endpoints - Updated with complete AIReflection interface
        if (endpoint.match(/\/reflection\/[\w-]+$/) && method === 'GET') {
          const tradeId = endpoint.split('/').pop();
          resolve({
            id: 'mock-reflection-id',
            tradeId: tradeId,
            userId: defaultUser.id,
            summary: 'This trade demonstrates good risk management principles with a clear entry and exit strategy.',
            strengths: [
              'Well-defined entry point based on technical analysis',
              'Appropriate position sizing relative to account balance',
              'Clear stop-loss placement to limit downside risk',
              'Disciplined execution of the trading plan'
            ],
            weaknesses: [
              'Could have held the position longer for greater profits',
              'Entry timing could be improved with better market timing',
              'Risk-reward ratio could be optimized further'
            ],
            suggestions: [
              'Consider using trailing stops to capture more upside',
              'Practice patience when waiting for optimal entry points',
              'Review market conditions before entering trades',
              'Keep detailed notes on what worked and what didn\'t',
              'Continue studying technical analysis patterns'
            ],
            sentiment: 'positive' as const,
            score: 7,
            createdAt: new Date(),
            updatedAt: new Date()
          } as unknown as T);
          return;
        }
        
        if (endpoint.match(/\/reflection\/generate\/[\w-]+/) && method === 'POST') {
          const tradeId = endpoint.split('/').pop()?.split('?')[0];
          resolve({
            id: 'mock-reflection-id',
            tradeId: tradeId,
            userId: defaultUser.id,
            summary: 'This trade shows your developing understanding of market dynamics and risk management.',
            strengths: [
              'Good entry timing based on technical signals',
              'Proper position sizing for your account level',
              'Disciplined approach to following your trading plan',
              'Effective use of stop-loss to manage risk'
            ],
            weaknesses: [
              'Exit strategy could be more systematic',
              'Market analysis could be more comprehensive',
              'Emotional discipline needs continued development'
            ],
            suggestions: [
              'Develop a more structured exit strategy',
              'Study multiple timeframes before entering trades',
              'Practice meditation or mindfulness to improve emotional control',
              'Keep a detailed trading journal to track patterns',
              'Consider paper trading to test new strategies'
            ],
            sentiment: 'positive' as const,
            score: 6,
            createdAt: new Date(),
            updatedAt: new Date()
          } as unknown as T);
          return;
        }
        
        // Default fallback
        resolve({} as T);
      }, 300);
    });
  }
  
  // Auth methods
  
  /**
   * Register a new user
   * @param email - User email
   * @param password - User password
   * @param name - User name
   * @param initialBalance - Initial trading balance (optional)
   * @returns Promise resolving to user data and token
   */
  async register(email: string, password: string, name: string, initialBalance?: number): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/register', 'POST', { 
      email, 
      password, 
      name,
      initialBalance
    });
    this.setToken(data.token);
    return data;
  }
  
  /**
   * Login a user
   * @param email - User email
   * @param password - User password
   * @returns Promise resolving to user data and token
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/login', 'POST', { email, password });
    this.setToken(data.token);
    return data;
  }
  
  /**
   * Get the current user
   * @returns Promise resolving to user data
   */
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }
  
  /**
   * Update user profile
   * @param userData - User data to update
   * @returns Promise resolving to updated user data
   */
  async updateUserProfile(userData: {
    firstName?: string;
    lastName?: string;
    initialBalance?: number;
  }): Promise<User> {
    try {
      const response = await this.request<any>('/auth/profile', 'PUT', userData);
      
      // If using mock data, simulate updating the user
      if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_REAL_API) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr) as User;
          const updatedUser = {
            ...user,
            name: userData.firstName && userData.lastName ? 
              `${userData.firstName} ${userData.lastName}` : user.name,
            firstName: userData.firstName || user.firstName,
            lastName: userData.lastName || user.lastName,
            initialBalance: userData.initialBalance !== undefined ? 
              userData.initialBalance : user.initialBalance,
            updatedAt: new Date()
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        }
      }
      
      // If the response is a User object, return it directly
      if (response && response.id) {
        return response;
      }
      
      // If the response is an object with a 'data' property, return that
      if (response && response.data) {
        return response.data;
      }
      
      throw new Error('Failed to update user profile');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
  
  /**
   * Change user password
   * @param passwordData - Password data
   * @returns Promise resolving to success status
   */
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean }> {
    try {
      const response = await this.request<any>('/auth/password', 'PUT', passwordData);
      
      // If using mock data, simulate password change
      if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_REAL_API) {
        return { success: true };
      }
      
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
      console.error('Error changing password:', error);
      throw error;
    }
  }
  
  /**
   * Logout the current user
   */
  logout(): void {
    this.clearToken();
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
    const token = this.getToken();
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
    const token = this.getToken();
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
    const token = this.getToken();
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
