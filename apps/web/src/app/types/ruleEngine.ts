import { DataType, RuleAction } from "@molen/shared-types";
export { DataType, RuleAction };

export interface SchemaProperty {
  id: string;
  key: string;
  type: DataType;
}

export interface RuleTypeView {
  id: string;
  name: string;
  baseType: DataType;
  schema?: SchemaProperty[]; // For OBJECT types
  description?: string;
}

export enum LogicalOperator {
  AND = "AND",
  OR = "OR",
}

export interface LogicBlock {
  id: string;
  variable: string; // e.g., "input.name" or "input"
  operator: string; // e.g., "starts_with", ">"
  value: unknown;
  variableType: DataType;
  connector?: LogicalOperator; // AND/OR to next block
}

export interface TypedRuleView {
  id: string;
  name: string;
  ruleTypeId: string; // References a RuleTypeView
  description?: string;
  mode: "visual" | "code";
  visualBlocks?: LogicBlock[];
  codeExpression?: string;
  action: RuleAction;
  priority: number;
  status: string;
  validationStatus?: {
    valid: boolean;
    errors?: string[];
  };
}

// Type-aware operator definitions
export const TypeOperators: Record<DataType, Array<{ value: string; label: string; syntax?: string }>> = {
  [DataType.NUMBER]: [
    { value: "eq", label: "Equals (==)", syntax: "==" },
    { value: "neq", label: "Not Equals (!=)", syntax: "!=" },
    { value: "gt", label: "Greater Than (>)", syntax: ">" },
    { value: "lt", label: "Less Than (<)", syntax: "<" },
    { value: "gte", label: "Greater or Equal (>=)", syntax: ">=" },
    { value: "lte", label: "Less or Equal (<=)", syntax: "<=" },
    { value: "between", label: "Between", syntax: "between()" },
  ],
  [DataType.STRING]: [
    { value: "eq", label: "Equals (==)", syntax: "==" },
    { value: "neq", label: "Not Equals (!=)", syntax: "!=" },
    { value: "contains", label: "Contains", syntax: "contains()" },
    { value: "starts_with", label: "Starts With", syntax: "starts_with()" },
    { value: "ends_with", label: "Ends With", syntax: "ends_with()" },
    { value: "matches", label: "Matches Regex", syntax: "matches()" },
    { value: "in", label: "In List", syntax: "in()" },
  ],
  [DataType.DATETIME]: [
    { value: "eq", label: "Equals (==)", syntax: "==" },
    { value: "before", label: "Before", syntax: "before()" },
    { value: "after", label: "After", syntax: "after()" },
    { value: "between", label: "Between", syntax: "between()" },
    { value: "within_days", label: "Within Days", syntax: "within_days()" },
  ],
  [DataType.BOOLEAN]: [
    { value: "is_true", label: "Is True", syntax: "== true" },
    { value: "is_false", label: "Is False", syntax: "== false" },
  ],
  [DataType.OBJECT]: [
    { value: "exists", label: "Exists", syntax: "exists()" },
    { value: "is_null", label: "Is Null", syntax: "is_null()" },
  ],
  [DataType.TIMESTAMP]: [],
  [DataType.ARRAY]: [],
  [DataType.GEO_COORDINATES]: [],
  [DataType.ANOMALY_SCORE]: [],
};

// Built-in functions with syntax highlighting
export const BuiltInFunctions = [
  "starts_with",
  "ends_with",
  "contains",
  "matches",
  "between",
  "before",
  "after",
  "within_days",
  "exists",
  "is_null",
  "in",
  "len",
  "upper",
  "lower",
  "trim",
];

export const LogicalKeywords = ["and", "or", "not", "if", "then", "else"];

export const TypeColors: Record<string, { color: string; bg: string; border: string }> = {
  [DataType.NUMBER]: { color: "text-green-500", bg: "bg-green-500/20", border: "border-green-500/50" },
  [DataType.STRING]: { color: "text-blue-500", bg: "bg-blue-500/20", border: "border-blue-500/50" },
  [DataType.DATETIME]: { color: "text-orange-500", bg: "bg-orange-500/20", border: "border-orange-500/50" },
  [DataType.TIMESTAMP]: { color: "text-orange-500", bg: "bg-orange-500/20", border: "border-orange-500/50" },
  [DataType.BOOLEAN]: { color: "text-purple-500", bg: "bg-purple-500/20", border: "border-purple-500/50" },
  [DataType.OBJECT]: { color: "text-indigo-500", bg: "bg-indigo-500/20", border: "border-indigo-500/50" },
  [DataType.ARRAY]: { color: "text-violet-500", bg: "bg-violet-500/20", border: "border-violet-500/50" },
  [DataType.GEO_COORDINATES]: { color: "text-cyan-500", bg: "bg-cyan-500/20", border: "border-cyan-500/50" },
  [DataType.ANOMALY_SCORE]: { color: "text-rose-500", bg: "bg-rose-500/20", border: "border-rose-500/50" },
};
