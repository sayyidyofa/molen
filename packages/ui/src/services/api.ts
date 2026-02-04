/**
 * API client for communicating with the Fraud-Ops backend
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  private async request(endpoint: string, options?: RequestInit) {
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
  async processTransaction(transaction: any) {
    return this.request('/waterfall/process', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async getShadowMode() {
    return this.request('/waterfall/shadow-mode');
  }

  async setShadowMode(enabled: boolean) {
    return this.request('/waterfall/shadow-mode', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  // Rule endpoints
  async getRules() {
    return this.request('/rules');
  }

  async updateRule(ruleId: string, updates: any) {
    return this.request(`/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async publishRules() {
    return this.request('/rules/publish', {
      method: 'POST',
    });
  }

  // Triage endpoints
  async getFlaggedCases(params?: { from?: number; size?: number; minScore?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.from !== undefined) queryParams.set('from', params.from.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.minScore !== undefined) queryParams.set('minScore', params.minScore.toString());
    
    const query = queryParams.toString();
    return this.request(`/triage/cases${query ? '?' + query : ''}`);
  }

  async getCaseDetails(caseId: string) {
    return this.request(`/triage/cases/${caseId}`);
  }
}

export const apiClient = new ApiClient();
