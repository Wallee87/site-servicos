const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Criar um novo contato
exports.createContact = async (req, res) => {
  try {
    const { nome, email, telefone, servico, mensagem } = req.body;
    
    // Validar dados
    if (!nome || !email || !servico || !mensagem) {
      return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
    }
    
    // Criar novo contato no banco de dados
    const newContact = new Contact({
      nome,
      email,
      telefone,
      servico,
      mensagem
    });
    
    await newContact.save();
    
    // Enviar email de confirmação
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recebemos sua mensagem!',
      html: `
        <h1>Olá ${nome},</h1>
        <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
        <p>Detalhes da sua solicitação:</p>
        <ul>
          <li><strong>Serviço:</strong> ${servico}</li>
          <li><strong>Mensagem:</strong> ${mensagem}</li>
        </ul>
        <p>Atenciosamente,<br>Equipe WebCreative</p>
      `
    };
    
    transporter.sendMail(mailOptions);
    
    // Enviar email para você (proprietário do site)
    const ownerMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Novo contato pelo site',
      html: `
        <h1>Novo contato pelo formulário do site</h1>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${telefone || 'Não informado'}</p>
        <p><strong>Serviço:</strong> ${servico}</p>
        <p><strong>Mensagem:</strong> ${mensagem}</p>
      `
    };
    
    transporter.sendMail(ownerMailOptions);
    
    res.status(201).json({ 
      success: true,
      message: 'Mensagem enviada com sucesso!',
      contact: newContact 
    });
  } catch (error) {
    console.error('Erro ao salvar contato:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao processar sua solicitação' 
    });
  }
};

// Listar todos os contatos (para painel administrativo)
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ dataCriacao: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar contatos' });
  }
};

// Obter um contato específico
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contato não encontrado' });
    }
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar contato' });
  }
};

// Marcar contato como respondido (para painel administrativo)
exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id, 
      { respondido: true }, 
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({ message: 'Contato não encontrado' });
    }
    
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar contato' });
  }
};

// Excluir um contato
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contato não encontrado' });
    }
    
    res.status(200).json({ message: 'Contato removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover contato' });
  }
};