import { test, expect } from '@playwright/test';

test.describe('Schema Management', () => {
  test('should create, edit, and delete a schema', async ({ page }) => {
    const timestamp = Date.now();
    const schemaName = `E2E-Schema-${timestamp}`;
    const updatedName = `${schemaName}-Updated`;

    await page.goto('/');
    await page.getByRole('link', { name: 'Input Schemas' }).click();

    // 1. Check Create Dialog & "Add Field" behavior
    await page.getByRole('button', { name: 'New Schema' }).click();
    await page.fill('#name', schemaName);
    
    // Click Add Field - should NOT trigger create
    await page.getByRole('button', { name: 'Add Field' }).click();
    
    // Wait a bit to ensure no toast appears
    await page.waitForTimeout(500);
    await expect(page.getByText(/Created/)).not.toBeVisible();
    
    // Fill field name
    await page.locator('input[placeholder="Field name"]').first().fill('testField');
    
    // Now click Create
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText(`Created ${schemaName}`)).toBeVisible();

    // 2. Edit Schema
    const schemaRow = page.locator('tr').filter({ hasText: schemaName });
    await expect(schemaRow).toBeVisible();
    
    // Click the Edit button (first action button)
    await schemaRow.locator('button').first().click();
    
    await page.fill('#name', updatedName);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText(`Updated ${updatedName}`)).toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();

    // 3. Delete Schema
    // Set up dialog handler for confirm()
    page.on('dialog', dialog => dialog.accept());
    
    const updatedRow = page.locator('tr').filter({ hasText: updatedName });
    await updatedRow.locator('button').nth(1).click();
    
    await expect(page.getByText(`Deleted ${updatedName}`)).toBeVisible();
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });
});
