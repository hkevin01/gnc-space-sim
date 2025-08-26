// Custom Cypress commands for GNC Space Sim

// Add custom commands to the Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      getByTestId(dataTestId: string): Chainable<Element>;
      tab(): Chainable<Element>;
      waitForCanvas(): Chainable<Element>;
      checkMissionPhase(): Chainable<Element>;
    }
  }
}

// Get element by data-testid
Cypress.Commands.add('getByTestId', (dataTestId: string) => {
  return cy.get(`[data-testid="${dataTestId}"]`);
});

// Tab to next focusable element
Cypress.Commands.add('tab', () => {
  return cy.focused().tab();
});

// Wait for 3D canvas to be ready
Cypress.Commands.add('waitForCanvas', () => {
  return cy.get('canvas', { timeout: 20000 }).should('be.visible');
});

// Check for mission phase display
Cypress.Commands.add('checkMissionPhase', () => {
  return cy.contains(/mission phase/i).should('be.visible');
});

export { };

