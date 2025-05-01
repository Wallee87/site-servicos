// api/contact.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  console.log('▶️ Payload:', req.body)

  const { nome, email, telefone, servico, mensagem } = req.body
  const { data, error } = await supabase
    .from('site_servicos_contatos')
    .insert([{ nome, email, telefone, servico, mensagem }])

  console.log('▶️ Supabase returned data:', data)
  console.log('▶️ Supabase returned error:', JSON.stringify(error, null, 2))

  if (error) {
    // Retorna o objeto de erro completo para o cliente
    return res.status(500).json({ success: false, error })
  }
  return res.status(200).json({ success: true, data })
}
