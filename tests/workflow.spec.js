const { test, expect } = require('@playwright/test');

test.describe('core user workflows', () => {
  test('Market Search generates professional source links', async ({ page }) => {
    await page.goto('/market-search');
    await page.fill('#role', 'Executive Director Technology Risk and Controls');
    await page.fill('#location', 'Remote United States');
    await page.selectOption('#lane', 'IT Risk');
    await page.fill('#keywords', 'technology risk, controls, governance, information security');
    await page.getByRole('button', { name: /generate market search links/i }).click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('text=LinkedIn Jobs')).toBeVisible();
    await expect(page.locator('text=Greenhouse')).toBeVisible();
  });

  test('Job Fit Review produces routing decision and handoff buttons', async ({ page }) => {
    await page.goto('/job-fit-review');
    await page.fill('#name', 'Test Candidate');
    await page.fill('#company', 'Example Bank');
    await page.fill('#role', 'Director Technology Risk and Controls');
    await page.selectOption('#lane', 'IT Risk');
    await page.selectOption('#level', 'Director');
    await page.fill('#link', 'https://example.com/job');
    await page.fill('#cvText', 'Director technology risk leader with 15 years of experience. Led control governance, risk assessments, information security oversight, audit remediation, and executive reporting across large financial services teams. Delivered measurable improvements including 30 percent cycle time reduction and governance routines across multiple stakeholders.');
    await page.fill('#jobText', 'The Director Technology Risk and Controls role requires technology risk management, control governance, audit remediation, executive communication, information security, stakeholder management, risk assessments, and evidence-based oversight. Preferred experience includes financial services, governance frameworks, and measurable control improvements.');
    await page.getByRole('button', { name: /run job-specific fit review/i }).click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#decision')).toContainText(/Routing decision/i);
    await expect(page.getByRole('button', { name: /save to case manager/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send to application package/i })).toBeVisible();
  });

  test('Case Manager can add a role and show next action', async ({ page }) => {
    await page.goto('/case-manager');
    await page.fill('#company', 'Example Bank');
    await page.fill('#role', 'Director Technology Risk and Controls');
    await page.selectOption('#source', 'LinkedIn');
    await page.selectOption('#fit', 'Strong fit');
    await page.selectOption('#cv', 'Ready');
    await page.selectOption('#pkg', 'Ready');
    await page.selectOption('#app', 'Ready to apply');
    await page.fill('#notes', 'Ready for human review and application.');
    await page.getByRole('button', { name: /^add role$/i }).click();
    await expect(page.locator('#board')).toContainText('Director Technology Risk and Controls');
    await expect(page.locator('#todayActions')).toContainText(/Apply|Ready|action/i);
  });
});
