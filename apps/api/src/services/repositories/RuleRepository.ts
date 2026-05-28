import postgres from 'postgres';
import { Rule, RuleType, TypedRule } from '@molen/shared-types';
import { mapRule, mapRuleType, mapTypedRule } from './mappers';

export class RuleRepository {
  constructor(private sql: postgres.Sql) {}

  async getRules(): Promise<Rule[]> {
    return (await this.sql`SELECT * FROM rules`).map(mapRule);
  }

  async addRule(rule: Omit<Rule, 'id'>): Promise<Rule> {
    const [inserted] = await this.sql`
      INSERT INTO rules (name, condition, anomaly_score, action)
      VALUES (${rule.name}, ${rule.condition}, ${rule.anomalyScore}, ${rule.action})
      RETURNING *
    `;
    return mapRule(inserted);
  }

  async deleteRule(id: string): Promise<Rule | null> {
    const [deleted] = await this.sql`DELETE FROM rules WHERE id = ${id} RETURNING *`;
    return deleted ? mapRule(deleted) : null;
  }

  async updateRule(id: string, rule: Partial<Rule>): Promise<Rule | null> {
    const [updated] = await this.sql`
      UPDATE rules SET
        name = ${rule.name || this.sql`name`},
        condition = ${rule.condition || this.sql`condition`},
        anomaly_score = ${rule.anomalyScore !== undefined ? rule.anomalyScore : this.sql`anomaly_score`},
        action = ${rule.action || this.sql`action`}
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? mapRule(updated) : null;
  }

  // Rule Types
  async getRuleTypes(): Promise<RuleType[]> {
    return (await this.sql`SELECT * FROM rule_types`).map(mapRuleType);
  }

  async addRuleType(ruleType: Omit<RuleType, 'id'>): Promise<RuleType> {
    const [inserted] = await this.sql`
      INSERT INTO rule_types (name, base_type, schema, description)
      VALUES (${ruleType.name}, ${ruleType.baseType}, ${this.sql.json(ruleType.schema as any)}, ${ruleType.description || null})
      RETURNING *
    `;
    return mapRuleType(inserted);
  }

  async deleteRuleType(id: string): Promise<RuleType | null> {
    const [deleted] = await this.sql`DELETE FROM rule_types WHERE id = ${id} RETURNING *`;
    return deleted ? mapRuleType(deleted) : null;
  }

  async updateRuleType(id: string, ruleType: Partial<RuleType>): Promise<RuleType | null> {
    const [updated] = await this.sql`
      UPDATE rule_types SET
        name = ${ruleType.name || this.sql`name`},
        base_type = ${ruleType.baseType || this.sql`base_type`},
        schema = ${ruleType.schema ? this.sql.json(ruleType.schema as any) : this.sql`schema`},
        description = ${ruleType.description || this.sql`description`}
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? mapRuleType(updated) : null;
  }

  // Typed Rules
  async getTypedRules(): Promise<TypedRule[]> {
    return (await this.sql`SELECT * FROM typed_rules`).map(mapTypedRule);
  }

  async addTypedRule(typedRule: Omit<TypedRule, 'id'>): Promise<TypedRule> {
    const [inserted] = await this.sql`
      INSERT INTO typed_rules (name, rule_type_id, description, mode, visual_blocks, code_expression, action, priority, status)
      VALUES (${typedRule.name}, ${typedRule.ruleTypeId}, ${typedRule.description || null}, ${typedRule.mode}, ${this.sql.json(typedRule.visualBlocks as any)}, ${typedRule.codeExpression || null}, ${typedRule.action}, ${typedRule.priority}, ${typedRule.status})
      RETURNING *
    `;
    return mapTypedRule(inserted);
  }

  async deleteTypedRule(id: string): Promise<TypedRule | null> {
    const [deleted] = await this.sql`DELETE FROM typed_rules WHERE id = ${id} RETURNING *`;
    return deleted ? mapTypedRule(deleted) : null;
  }

  async updateTypedRule(id: string, typedRule: Partial<TypedRule>): Promise<TypedRule | null> {
    const [updated] = await this.sql`
      UPDATE typed_rules SET
        name = ${typedRule.name || this.sql`name`},
        rule_type_id = ${typedRule.ruleTypeId || this.sql`rule_type_id`},
        description = ${typedRule.description || this.sql`description`},
        mode = ${typedRule.mode || this.sql`mode`},
        visual_blocks = ${typedRule.visualBlocks ? this.sql.json(typedRule.visualBlocks as any) : this.sql`visual_blocks`},
        code_expression = ${typedRule.codeExpression || this.sql`code_expression`},
        action = ${typedRule.action || this.sql`action`},
        priority = ${typedRule.priority !== undefined ? typedRule.priority : this.sql`priority`},
        status = ${typedRule.status || this.sql`status`}
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? mapTypedRule(updated) : null;
  }
}
