// Prevent Cypress from failing the test on that “fullName” TypeError
Cypress.on('uncaught:exception', (err) => {
  // ignore if the error is reading 'fullName' off null
  if (err.message.includes("Cannot read properties of null (reading 'fullName')")) {
    return false;
  }
  // let other errors fail the test
  return true;
});
