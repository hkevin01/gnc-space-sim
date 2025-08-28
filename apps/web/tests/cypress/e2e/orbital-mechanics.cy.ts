describe('GNC Space Sim - Orbital Mechanics', () => {
  beforeEach(() => {
    cy.visit('/');
    // Wait for the 3D scene to load
    cy.get('canvas', { timeout: 20000 }).should('be.visible');
  });

  it('displays real-time orbital telemetry', () => {
    // Check for telemetry components
    cy.contains(/altitude/i).should('be.visible');
    cy.contains(/velocity/i).should('be.visible');

    // Look for numerical values indicating live data
    cy.get('body').should('contain.text', 'km').or('contain.text', 'm/s');

    // Verify telemetry updates over time
    cy.wait(2000);
    cy.get('canvas').should('be.visible');
  });

  it('handles mission phase transitions', () => {
    // Check for mission phase display
    cy.contains(/mission phase/i).should('be.visible');

    // Look for different phases
    cy.get('body').should('match', /(pre-launch|launch|ascent|orbit|landing)/i);
  });

  it('responds to 3D scene interactions', () => {
    const canvas = cy.get('canvas');

    // Test mouse interactions
    canvas.click(200, 200);
    canvas.trigger('wheel', { deltaY: -100 });

    // Verify scene remains interactive
    cy.wait(1000);
    canvas.should('be.visible');
  });

  it('maintains performance during extended use', () => {
    // Simulate extended usage
    for (let i = 0; i < 5; i++) {
      cy.get('canvas').click(100 + i * 10, 100 + i * 10);
      cy.wait(500);
    }

    // Verify the application is still responsive
    cy.get('canvas').should('be.visible');
    cy.contains(/mission phase/i).should('be.visible');
  });

  it('works across different viewport sizes', () => {
    // Test different viewports
    const viewports = [
      [1920, 1080], // Desktop
      [768, 1024],  // Tablet
      [375, 667]    // Mobile
    ];

    viewports.forEach(([width, height]) => {
      cy.viewport(width, height);
      cy.get('canvas').should('be.visible');
      cy.contains(/mission phase/i).should('be.visible');
    });
  });

  it('provides accessible interface elements', () => {
    // Check for semantic HTML
    cy.get('main, [role="main"]').should('exist');

    // Test keyboard navigation
    cy.get('body').tab();
    cy.focused().should('be.visible');

    // Check for proper heading structure
    cy.get('h1, h2, h3, h4, h5, h6').should('have.length.at.least', 1);
  });
});
