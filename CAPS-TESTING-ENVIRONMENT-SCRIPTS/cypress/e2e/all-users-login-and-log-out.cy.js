describe('User Login Automation (Updated Production Users)', () => {
  const users = [
    // Dean Account
    { id: '23-A-12345', password: '12345678', name: 'GILLERT BONGCAC (Dean - Dapitan)' },

    // Program Chair Accounts
    { id: '23-A-12346', password: '12345678', name: 'TROY LASCO (Program Chair - BSCpE - Dapitan)' },
    { id: '23-A-11111', password: '12345678', name: 'AGRI BIO (Program Chair - BSABE - Tampilisan)' },
    { id: '23-A-22222', password: '12345678', name: 'CE ENGR (Program Chair - BSCE - Dapitan)' },
    { id: '23-A-33333', password: '12345678', name: 'ECE ENG (Program Chair - BSECE - Dapitan)' },
    { id: '23-A-55555', password: '12345678', name: 'EE EGR (Program Chair - BSEE - Dapitan)' },

    // Faculty Accounts
    { id: '23-A-12347', password: '12345678', name: 'RYANN ELUMBA (Faculty - BSCpE - Dapitan)' },
    { id: '23-A-11112', password: '12345678', name: 'ABE2 BIO (Faculty - BSABE - Tampilisan)' },
    { id: '23-A-22223', password: '12345678', name: 'CE2 ENGR (Faculty - BSCE - Dapitan)' },
    { id: '23-A-33334', password: '12345678', name: 'ECE2 ENG (Faculty - BSECE - Dapitan)' },
    { id: '23-A-55556', password: '12345678', name: 'EE2 EGR (Faculty - BSEE - Dapitan)' },
  ];

  users.forEach((user) => {
    it(`should log in and log out as ${user.name}`, () => {
      cy.visit('https://caps-test2.coeofjrmsu.com');

      // Login
      cy.get('input[placeholder="Enter ID Number"]').type(user.id);
      cy.get('input[placeholder="Enter Password"]').type(user.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '-dashboard');

      // Wait for user profile API to confirm login success
      cy.intercept('GET', '/api/user/profile').as('getUserProfile');
      cy.wait('@getUserProfile');

      // Open the menu and log out
      cy.get('i.bx.bx-dots-vertical-rounded').click();
      cy.get('button')
        .contains('Log-out')
        .should('be.visible', { timeout: 20000 })
        .first()
        .click();

      // Confirm redirection to login
      cy.url().should('not.include', '-dashboard');
    });
  });
});
