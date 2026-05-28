import { RuleTypeView, DataType, LogicalOperator, TypeOperators, LogicBlock } from "../types/ruleEngine";

// Rule Engine Helper Functions

export const getVariablesForRuleType = (ruleType: RuleTypeView): Array<{ path: string; type: DataType; label: string }> => {
  if (ruleType.baseType === DataType.OBJECT && ruleType.schema) {
    return ruleType.schema.map((prop) => ({
      path: `input.${prop.key}`,
      type: prop.type,
      label: `{{input.${prop.key}}} [${prop.type}]`,
    }));
  }
  return [{ path: "input", type: ruleType.baseType, label: `{{input}} [${ruleType.baseType}]` }];
};

export const validateRuleExpression = (expression: string): { valid: boolean; errors?: string[] } => {
  const errors: string[] = [];

  // Basic validation - check for {{input}} references
  const variablePattern = /\{\{input(?:\.\w+)?\}\}/g;
  const matches = expression.match(variablePattern);

  if (!matches || matches.length === 0) {
    errors.push("Expression must contain at least one {{input}} reference");
  }

  // Check for unmatched braces
  const openBraces = (expression.match(/\{\{/g) || []).length;
  const closeBraces = (expression.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push("Unmatched braces in expression");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

// Convert visual blocks to code expression
export const visualBlocksToCode = (blocks: LogicBlock[]): string => {
  if (!blocks || blocks.length === 0) return "";

  return blocks
    .map((block, index) => {
      const operator = TypeOperators[block.variableType]?.find((op) => op.value === block.operator);
      let expression: string;

      // Handle different operator types
      if (operator?.syntax) {
        const syntax = operator.syntax;

        if (syntax.includes("()")) {
          // Function-based operator (e.g., contains(), starts_with())
          const funcName = syntax.replace("()", "");

          // Only add value if it's not null/undefined
          if (block.value !== null && block.value !== undefined && block.value !== "") {
            const formattedValue = typeof block.value === "string" ? `"${block.value}"` : block.value;
            expression = `{{${block.variable}}} ${funcName}(${formattedValue})`;
          } else {
            expression = `{{${block.variable}}} ${funcName}()`;
          }
        } else {
          // Comparison operator (e.g., >, ==, !=)
          // For operators that don't need a value (like is_true, is_false)
          if (syntax === "== true" || syntax === "== false") {
            expression = `{{${block.variable}}} ${syntax}`;
          } else if (block.value !== null && block.value !== undefined && block.value !== "") {
            const formattedValue = typeof block.value === "string" ? `"${block.value}"` : block.value;
            expression = `{{${block.variable}}} ${syntax} ${formattedValue}`;
          } else {
            expression = `{{${block.variable}}} ${syntax}`;
          }
        }
      } else {
        if (block.value !== null && block.value !== undefined && block.value !== "") {
          expression = `{{${block.variable}}} ${block.operator} ${block.value}`;
        } else {
          expression = `{{${block.variable}}} ${block.operator}`;
        }
      }

      // Add connector if not the last block
      if (index < blocks.length - 1 && block.connector) {
        expression += ` ${block.connector.toLowerCase()}`;
      }

      return expression;
    })
    .join(" ");
};

// Parse code expression into visual blocks (simplified - handles basic cases)
export const codeToVisualBlocks = (expression: string, ruleType: RuleTypeView): LogicBlock[] => {
  if (!expression || expression.trim() === "") return [];

  const blocks: LogicBlock[] = [];

  // Split by logical operators (and/or)
  const parts = expression.split(/\s+(and|or)\s+/i);

  for (let i = 0; i < parts.length; i += 2) {
    const part = parts[i].trim();
    const connector = parts[i + 1]?.toUpperCase() as LogicalOperator | undefined;

    // Extract variable {{input.field}}
    const varMatch = part.match(/\{\{(input(?:\.\w+)?)\}\}/);
    if (!varMatch) continue;

    const variable = varMatch[1];

    // Determine variable type
    const variables = getVariablesForRuleType(ruleType);
    const varInfo = variables.find((v) => v.path === variable);
    if (!varInfo) continue;

    // Try to match operator and value
    let operator = "";
    let value: unknown = "";

    // Check for function-based operators (e.g., contains("value"))
    const funcMatch = part.match(/\}\}\s+(\w+)\((.*?)\)/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      value = funcMatch[2].replace(/^["']|["']$/g, ""); // Remove quotes

      // Find matching operator
      const ops = TypeOperators[varInfo.type] || [];
      const matchedOp = ops.find((op) => op.syntax && op.syntax.includes(funcName));
      operator = matchedOp?.value || funcName;
    } else {
      // Check for comparison operators (>, <, ==, etc.)
      const compMatch = part.match(/\}\}\s*(==|!=|>=|<=|>|<)\s*(.+)/);
      if (compMatch) {
        const syntax = compMatch[1];
        value = compMatch[2].replace(/^["']|["']$/g, "").trim();

        // Convert to number if applicable
        if (varInfo.type === DataType.NUMBER && !isNaN(Number(value))) {
          value = Number(value);
        }

        const ops = TypeOperators[varInfo.type] || [];
        const matchedOp = ops.find((op) => op.syntax === syntax);
        operator = matchedOp?.value || syntax;
      }
    }

    blocks.push({
      id: `block-${Date.now()}-${i}`,
      variable,
      operator,
      value,
      variableType: varInfo.type,
      connector: connector || undefined,
    });
  }

  return blocks;
};
