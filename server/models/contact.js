
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  telefone: {
    type: String,
    required: false
  },
  servico: {
    type: String,
    enum: ['landing-page', 'e-commerce', 'e-learning', 'outro'],
    required: true
  },
  mensagem: {
    type: String,
    required: true
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contact', contactSchema);
