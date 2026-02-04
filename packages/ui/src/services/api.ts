import {
  Transaction,
  RuleUpdate,
  ShadowModeResponse,
  RulesResponse,
  TriageResponse,
  PublishResponse,
  ProcessTransactionResponse,
  FlaggedCase,
} from '../types/api.types';

/**
 * API client for communicating with the Fraud-Ops backend
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Waterfall endpoints
  async processTransaction(transaction: Transaction): Promise<ProcessTransactionResponse> {
    return this.request<ProcessTransactionResponse>('/waterfall/process', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async getShadowMode(): Promise<ShadowModeResponse> {
    return this.request<ShadowModeResponse>('/waterfall/shadow-mode');
  }

  async setShadowMode(enabled: boolean): Promise<ShadowModeResponse> {
    return this.request<ShadowModeResponse>('/waterfall/shadow-mode', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  // Rule endpoints
  async getRules(): Promise<RulesResponse> {
    return this.request<RulesResponse>('/rules');
  }

  async updateRule(ruleId: string, updates: RuleUpdate): Promise<RuleUpdate> {
    return this.request<RuleUpdate>(`/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async publishRules(): Promise<PublishResponse> {
    return this.request<PublishResponse>('/rules/publish', {
      method: 'POST',
    });
  }

  // Triage endpoints
  async getFlaggedCases(params?: { from?: number; size?: number; minScore?: number }): Promise<TriageResponse> {
    const queryParams = new URLSearchParams();
    if (params?.from !== undefined) queryParams.set('from', params.from.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.minScore !== undefined) queryParams.set('minScore', params.minScore.toString());
    
    const query = queryParams.toString();
    return this.request<TriageResponse>(`/triage/cases${query ? '?' + query : ''}`);
  }

  async getCaseDetails(caseId: string): Promise<FlaggedCase> {
    return this.request<FlaggedCase>(`/triage/cases/${caseId}`);
  }
}

export const apiClient = new ApiClient();
