/**
 * Shared types for API services
 */

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
  [key: string]: unknown;
}

export interface TriageResult {
  total: number;
  cases: FlaggedCase[];
}
