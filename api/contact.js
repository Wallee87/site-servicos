// api/contact.js
import { createClient } from '@supabase/supabase-js'

// instancia o cliente Supabase com suas ENV vars
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // só aceita POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    // extrai os campos enviados pelo formulário
    const { nome, email, telefone, servico, mensagem } = req.body

    // insere no Supabase (tabela "contacts")
    const { data, error } = await supabase
      .from('contacts')
      .insert([{ nome, email, telefone, servico, mensagem }])

    if (error) throw error

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
