describe('E2E flow', () => {
  it('registers, creates product, adds sale, predicts and checks free limit', () => {
    const email = `e2e_${Date.now()}@example.com`;
    cy.visit('/register');
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Mot de passe"]').type('secret');
    cy.get('button').contains("S'inscrire").click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    cy.visit('/create-product');
    cy.get('input[placeholder="Nom"]').type('E2E Product');
    cy.get('input[placeholder="SKU"]').type('E2E-SKU');
    cy.get('button').contains('Créer produit').click();
    cy.visit('/');
    cy.contains('E2E Product');

    cy.visit('/add-sale');
    cy.get('input[type="number"]').first().clear().type('1');
    cy.get('input[type="number"]').last().clear().type('2');
    cy.get('button').contains('Ajouter vente').click();

    cy.visit('/predict');
    for (let i=0;i<5;i++){
      cy.get('input[type="number"]').first().clear().type('1');
      cy.get('input[type="number"]').last().clear().type('30');
      cy.get('button').contains('Prédire').click();
      cy.contains('Probabilité').should('exist');
    }
    cy.get('input[type="number"]').first().clear().type('1');
    cy.get('input[type="number"]').last().clear().type('30');
    cy.get('button').contains('Prédire').click();
    cy.contains('Free trial limit reached').should('exist');
  });
});
