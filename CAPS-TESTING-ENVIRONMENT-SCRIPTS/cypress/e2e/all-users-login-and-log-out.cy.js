describe('User Login Automation (Updated Production Users)', () => {
  const users = [
    // Dean Accounts
  {
    id: '23-A-12345',
    password: '12345678',
    name: 'Gillert Bongcac (Dean - Dapitan)',
    email: 'bongcac@gmail.com',
    campus: 'Dapitan',
    position: 'Dean',
  },

  // Program Chair Accounts
  {
    id: '23-A-12346',
    password: '12345678',
    name: 'Troy Lasco (Program Chair - BSCpE - Dapitan)',
    email: 'Troy@gmail.com',
    campus: 'Dapitan',
    position: 'Program Chair',
    program: 'BSCpE',
  },
  {
    id: '23-A-11111',
    password: '12345678',
    name: 'Agri Bio (Program Chair - BSABE - Tampilisan)',
    email: 'abe@gmail.com',
    campus: 'Tampilisan',
    position: 'Program Chair',
    program: 'BSABE',
  },
  {
    id: '23-A-22222',
    password: '12345678',
    name: 'CE Engr (Program Chair - BSCE - Dapitan)',
    email: 'ce@gmail.com',
    campus: 'Dapitan',
    position: 'Program Chair',
    program: 'BSCE',
  },
  {
    id: '23-A-33333',
    password: '12345678',
    name: 'ECE Eng (Program Chair - BSECE - Dapitan)',
    email: 'ece@gmail.com',
    campus: 'Dapitan',
    position: 'Program Chair',
    program: 'BSECE',
  },
  {
    id: '23-A-55555',
    password: '12345678',
    name: 'EE Egr (Program Chair - BSEE - Dapitan)',
    email: 'ee@gmail.com',
    campus: 'Dapitan',
    position: 'Program Chair',
    program: 'BSEE',
  },

  // Faculty Accounts
  {
    id: '23-A-12347',
    password: '12345678',
    name: 'Ryann Elumba (Faculty - BSCpE - Dapitan)',
    email: 'Ryann@gmail.com',
    campus: 'Dapitan',
    position: 'Faculty',
    program: 'BSCpE',
  },
  {
    id: '23-A-11112',
    password: '12345678',
    name: 'Abe2 Bio (Faculty - BSABE - Tampilisan)',
    email: 'abe2@gmail.com',
    campus: 'Tampilisan',
    position: 'Faculty',
    program: 'BSABE',
  },
  {
    id: '23-A-22223',
    password: '12345678',
    name: 'CE2 Engr (Faculty - BSCE - Dapitan)',
    email: 'ce2@gmail.com',
    campus: 'Dapitan',
    position: 'Faculty',
    program: 'BSCE',
  },
  {
    id: '23-A-33334',
    password: '12345678',
    name: 'ECE2 Eng (Faculty - BSECE - Dapitan)',
    email: 'ece2@gmail.com',
    campus: 'Dapitan',
    position: 'Faculty',
    program: 'BSECE',
  },
  {
    id: '23-A-55556',
    password: '12345678',
    name: 'EE2 Egr (Faculty - BSEE - Dapitan)',
    email: 'ee2@gmail.com',
    campus: 'Dapitan',
    position: 'Faculty',
    program: 'BSEE',
  },
];  

  users.forEach((user) => {
    it(`should log in and log out as ${user.name}`, () => {
      cy.viewport(1280, 800);

      cy.visit('https://caps-test2.coeofjrmsu.com');

      cy.get('input#userCode').should('exist').first().type(user.id);
      cy.get('input[type="password"]').should('exist').first().type(user.password);

      // Debug: check how many buttons with type submit and text LOG IN are present
      cy.get('button[type="submit"]')
        .then((btns) => {
          cy.log(`Found ${btns.length} submit buttons`);
          const visibleBtns = Cypress.$(btns).filter(':visible');
          cy.log(`Found ${visibleBtns.length} visible submit buttons`);
        });

      // Click login button forcibly to bypass visibility issues
      cy.get('button[type="submit"]').contains('LOG IN').click({ force: true });

      // Intercept profile API and wait
      cy.intercept('GET', '/api/user/profile').as('getUserProfile');
      cy.wait('@getUserProfile', { timeout: 10000 });
      cy.url().should('include', '-dashboard');

      // Open logout menu
      cy.get('i.bx.bx-dots-vertical-rounded').click();

      // Click logout button forcibly if needed
      cy.get('button').contains('Log-out').click({ force: true });

      cy.url().should('not.include', '-dashboard');
    });
  });
});
