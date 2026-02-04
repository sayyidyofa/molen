import { Elysia } from 'elysia';
import { WaterfallService } from '../services/waterfall.service';
import { Transaction } from '@molen/core';

/**
 * Routes for waterfall transaction processing
 * Implements REQ-3.1 (Waterfall Monitor)
 */
export function waterfallRoutes(app: Elysia, waterfallService: WaterfallService) {
  return app.group('/waterfall', (app) =>
    app
      .post('/process', async ({ body }) => {
        const transaction = body as Transaction;
        const result = await waterfallService.processTransaction(transaction);
        return result;
      })
      .get('/shadow-mode', () => {
        return { shadowMode: waterfallService.getShadowMode() };
      })
      .put('/shadow-mode', async ({ body }) => {
        const { enabled } = body as { enabled: boolean };
        waterfallService.setShadowMode(enabled);
        return { shadowMode: enabled };
      })
  );
}
