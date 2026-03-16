/**
 * Real API service for Molen backend
 * Connects to Rust Axum API
 */

import type { Transaction, InferenceResult, Decision } from '../types/molen';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API response types
 */
export interface GraphConfig {
  id: string;
  name: string;
  description?: string;
  config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateGraphRequest {
  name: string;
  description?: string;
  config_json: Record<string, unknown>;
}

export interface UpdateGraphRequest {
  name?: string;
  description?: string;
  config_json?: Record<string, unknown>;
  is_active?: boolean;
}

export interface TestTransactionRequest {
  graph_id: string;
  transaction: Transaction;
}

export interface TestTransactionResponse {
  result: InferenceResult;
  execution_time_ms: number;
}

export interface HealthResponse {
  status: string;
  database?: string;
  redis?: string;
  kafka?: string;
}

/**
 * API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(
      error.message || `HTTP ${response.status}`,
      response.status,
      error
    );
  }
  return response.json();
}

/**
 * Molen API client
 */
export const api = {
  /**
   * Health check endpoint
   */
  async health(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthResponse>(response);
  },

  /**
   * Get all graph configurations
   */
  async getGraphs(): Promise<GraphConfig[]> {
    const response = await fetch(`${API_BASE_URL}/api/graphs`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<GraphConfig[]>(response);
  },

  /**
   * Get a specific graph configuration
   */
  async getGraph(id: string): Promise<GraphConfig> {
    const response = await fetch(`${API_BASE_URL}/api/graphs/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<GraphConfig>(response);
  },

  /**
   * Create a new graph configuration
   */
  async createGraph(data: CreateGraphRequest): Promise<GraphConfig> {
    const response = await fetch(`${API_BASE_URL}/api/graphs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<GraphConfig>(response);
  },

  /**
   * Update an existing graph configuration
   */
  async updateGraph(id: string, data: UpdateGraphRequest): Promise<GraphConfig> {
    const response = await fetch(`${API_BASE_URL}/api/graphs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<GraphConfig>(response);
  },

  /**
   * Delete a graph configuration
   */
  async deleteGraph(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/graphs/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(
        error.message || `HTTP ${response.status}`,
        response.status,
        error
      );
    }
  },

  /**
   * Test a transaction through the fraud detection pipeline
   */
  async testTransaction(
    graphId: string,
    transaction: Transaction
  ): Promise<TestTransactionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        graph_id: graphId,
        transaction,
      } as TestTransactionRequest),
    });
    return handleResponse<TestTransactionResponse>(response);
  },

  /**
   * Generate a mock transaction for testing
   */
  generateMockTransaction(): Transaction {
    return {
      transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: `user_${Math.floor(Math.random() * 10000)}`,
      amount_cents: Math.floor(Math.random() * 500000) + 1000, // $10 - $5000
      merchant: ['Amazon', 'Stripe', 'PayPal', 'Store XYZ', 'Online Shop'][
        Math.floor(Math.random() * 5)
      ],
      merchant_category: ['retail', 'online', 'services', 'entertainment'][
        Math.floor(Math.random() * 4)
      ],
      timestamp_ms: Date.now(),
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device_id: `device_${Math.random().toString(36).substr(2, 12)}`,
      country: ['US', 'UK', 'CA', 'AU'][Math.floor(Math.random() * 4)],
    };
  },
};

export default api;
