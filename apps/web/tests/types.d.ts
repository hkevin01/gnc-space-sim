// Global type declarations for testing environment

/// <reference types="cypress" />
/// <reference types="@playwright/test" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestId('greeting')
       */
      getByTestId(dataTestId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to tab to the next focusable element
       */
      tab(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// Playwright test utilities
export interface GNCTestContext {
  canvas: import('@playwright/test').Locator;
  missionPhase: import('@playwright/test').Locator;
  telemetry: import('@playwright/test').Locator;
}

export { };

