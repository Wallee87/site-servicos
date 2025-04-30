const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Rotas para contatos
router.post('/contact', contactController.createContact);
router.get('/contacts', contactController.getAllContacts);
router.get('/contacts/:id', contactController.getContactById);
router.put('/contacts/:id', contactController.updateContact);
router.delete('/contacts/:id', contactController.deleteContact);

module.exports = router;