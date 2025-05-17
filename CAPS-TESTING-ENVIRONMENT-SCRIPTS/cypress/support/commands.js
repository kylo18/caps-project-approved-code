// Cypress Custom Command for waiting until an element is visible
Cypress.Commands.add('waitForVisible', (selector, timeout = 10000) => {
    cy.get(selector, { timeout }).should('be.visible');
  });
  