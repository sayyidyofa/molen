import { Elysia } from 'elysia';
import { TriageService } from '../services/triage.service';

/**
 * Routes for case triage
 * Implements REQ-3.3 (Case Triage)
 */
export function triageRoutes(app: Elysia, triageService: TriageService) {
  return app.group('/triage', (app) =>
    app
      .get('/cases', async ({ query }) => {
        const params = {
          from: query.from ? parseInt(query.from as string, 10) : 0,
          size: query.size ? parseInt(query.size as string, 10) : 20,
          minScore: query.minScore ? parseInt(query.minScore as string, 10) : undefined,
        };
        const result = await triageService.getFlaggedTransactions(params);
        return result;
      })
      .get('/cases/:caseId', async ({ params }) => {
        const { caseId } = params;
        const caseDetails = await triageService.getCaseDetails(caseId);
        return caseDetails;
      })
  );
}
