describe('GNC Space Sim - Launch HUD', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the main application interface', () => {
    // Check page title
    cy.title().should('match', /GNC/i);

    // Wait for and verify mission controls are visible
    cy.contains(/Mission Phase/i, { timeout: 10000 }).should('be.visible');
    cy.contains(/Altitude/i, { timeout: 10000 }).should('be.visible');

    // Verify 3D canvas is rendered
    cy.get('canvas', { timeout: 15000 }).should('be.visible');
  });

  it('renders telemetry data', () => {
    // Check for telemetry elements
    cy.contains(/Mission Phase/i).should('be.visible');
    cy.contains(/Altitude/i).should('be.visible');

    // Look for numerical values or data displays
    cy.get('[data-testid="telemetry"]').should('exist').or('body').should('contain.text', 'km');
  });

  it('handles 3D scene interactions', () => {
    // Wait for canvas to load
    cy.get('canvas').should('be.visible');

    // Test basic canvas interaction
    cy.get('canvas').click(100, 100);

    // Allow time for any animation or response
    cy.wait(1000);

    // Verify the application is still responsive
    cy.get('canvas').should('be.visible');
  });

  it('displays without console errors', () => {
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError');
    });

    cy.visit('/');
    cy.wait(2000);

    // Check that no critical console errors occurred
    cy.get('@consoleError').should('not.have.been.calledWith', Cypress.sinon.match(/Error/));
  });
});
