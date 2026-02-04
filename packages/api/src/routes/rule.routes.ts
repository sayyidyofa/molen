import { Elysia } from 'elysia';
import { RuleService } from '../services/rule.service';

/**
 * Routes for rule management
 * Implements REQ-3.2 (Rule Editor)
 */
export function ruleRoutes(app: Elysia, ruleService: RuleService) {
  return app.group('/rules', (app) =>
    app
      .get('/', async () => {
        const rules = await ruleService.getRules();
        return { rules };
      })
      .put('/:ruleId', async ({ params, body }) => {
        const { ruleId } = params;
        const updates = body as any;
        const rule = await ruleService.updateRule(ruleId, updates);
        return rule;
      })
      .post('/publish', async () => {
        await ruleService.publishRules();
        return { message: 'Rules published successfully' };
      })
  );
}
