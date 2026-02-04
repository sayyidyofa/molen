/**
 * Shared types for UI API calls
 */

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Rule {
  id: string;
  name: string;
  value: number;
  type: 'stateless' | 'velocity';
  [key: string]: unknown;
}

export interface RuleUpdate {
  name?: string;
  value?: number;
  type?: 'stateless' | 'velocity';
  [key: string]: unknown;
}

export interface FlaggedCase {
  id: string;
  transaction: {
    id: string;
    userId: string;
    amount: number;
    timestamp: string;
  };
  totalScore: number;
  flagged: boolean;
  timestamp: string;
  results?: Array<{
    transactionId: string;
    score: number;
    flags: string[];
    timestamp: string;
    ruleType: string;
  }>;
  [key: string]: unknown;
}

export interface ShadowModeResponse {
  shadowMode: boolean;
}

export interface RulesResponse {
  rules: Rule[];
}

export interface TriageResponse {
  total: number;
  cases: FlaggedCase[];
}

export interface PublishResponse {
  message: string;
}

export interface ProcessTransactionResponse {
  transaction: Transaction;
  results: EvaluationResult[];
  totalScore: number;
  flagged: boolean;
  shadowMode: boolean;
}

export interface EvaluationResult {
  transactionId: string;
  score: number;
  flags: string[];
  timestamp: Date;
  ruleType: string;
}
