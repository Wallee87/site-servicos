# Integração do Formulário com Node.js e Banco de Dados

Este documento explica como configurar um servidor Node.js para receber e processar os dados do formulário de contato do seu site de portfólio e salvá-los em um banco de dados.

## Estrutura do Projeto

```
portfolio-site/
├── public/           # Arquivos estáticos (HTML, CSS, JS, imagens)
│   ├── index.html    # Seu arquivo HTML principal
│   ├── css/          # Arquivos CSS
│   ├── js/           # Arquivos JavaScript
│   └── img/          # Imagens
├── server/
│   ├── index.js      # Arquivo principal do servidor
│   ├── routes/       # Rotas da API
│   ├── controllers/  # Controladores
│   ├── models/       # Modelos do banco de dados
│   └── config/       # Configurações do banco de dados
├── package.json
└── .env              # Variáveis de ambiente
```

## 1. Configuração do Projeto

Primeiro, você precisa inicializar um projeto Node.js:

```bash
mkdir portfolio-site
cd portfolio-site
npm init -y
```

Instale as dependências necessárias:

```bash
npm install express mongoose dotenv cors morgan body-parser nodemailer
```

- **express**: Framework web para Node.js
- **mongoose**: ODM para MongoDB
- **dotenv**: Carregamento de variáveis de ambiente
- **cors**: Middleware para habilitar CORS
- **morgan**: Logger para requisições HTTP
- **body-parser**: Middleware para processar dados JSON
- **nodemailer**: Para enviar emails de confirmação

## 2. Configuração do Arquivo .env

Crie um arquivo `.env` na raiz do projeto:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/portfolio
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
```

## 3. Modelo do Banco de Dados

Crie o arquivo `server/models/Contact.js`:

```javascript
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
```

## 4. Controlador para Contatos

Crie o arquivo `server/controllers/contactController.js`:

```javascript
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
```

## 5. Rotas da API

Crie o arquivo `server/routes/api.js`:

```javascript
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
```

## 6. Arquivo Principal do Servidor

Crie o arquivo `server/index.js`:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Rotas da API
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Rota para o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

## 7. Scripts do Package.json

Atualize o arquivo `package.json` para incluir scripts úteis:

```json
"scripts": {
  "start": "node server/index.js",
  "dev": "nodemon server/index.js",
  "build": "echo 'Copiando arquivos estáticos...' && cp -r public/* dist/"
}
```

## 8. Finalizando a Configuração

Instale o Nodemon para desenvolvimento:

```bash
npm install nodemon --save-dev
```

## 9. Iniciando o Servidor

Para iniciar o servidor em modo de desenvolvimento:

```bash
npm run dev
```

Para produção:

```bash
npm start
```

## 10. Alternativas de Banco de Dados

Este tutorial usa MongoDB com Mongoose, mas você pode facilmente adaptar para outros bancos de dados:

### MySQL / PostgreSQL

Para usar MySQL ou PostgreSQL, substitua o Mongoose por Sequelize:

```bash
npm install sequelize mysql2
# ou
npm install sequelize pg pg-hstore
```

E adapte os modelos para o formato do Sequelize.

### SQLite (para projetos pequenos)

Para uma solução mais simples, você pode usar SQLite:

```bash
npm install sqlite3 sequelize
```

## 11. Deploy

Para deploy, recomendo:

1. **Vercel ou Netlify**: Para o frontend estático
2. **Render ou Railway**: Para o backend Node.js
3. **MongoDB Atlas**: Para banco de dados MongoDB em nuvem

## 12. Segurança

Lembre-se de adicionar medidas de segurança:

1. Validação de entradas
2. Proteção contra CSRF
3. Rate limiting para o endpoint de contato
4. Implementação de HTTPS
5. Sanitização de dados

## Conclusão

Seguindo estes passos, você terá um sistema completo de formulário de contato integrado ao Node.js e MongoDB. O sistema salvará os dados no banco de dados e enviará emails de confirmação tanto para você quanto para o cliente.

A estrutura modular permite expandir facilmente para adicionar mais funcionalidades no futuro, como um painel administrativo para gerenciar os contatos recebidos.