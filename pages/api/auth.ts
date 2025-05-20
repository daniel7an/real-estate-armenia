import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing environment variables for Supabase')
}

// Initialize the Supabase client with the service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      try {
        const { action, email, password } = req.body

        if (!action || !email || !password) {
          return res.status(400).json({ error: 'Missing required fields' })
        }

        if (action === 'register') {
          // Register a new user
          const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
          })

          if (error) {
            return res.status(400).json({ error: error.message })
          }

          return res.status(201).json({ user: data.user })
        }

        if (action === 'login') {
          // Login existing user - Note: This should be handled client-side
          // This is just a reference for how to do it server-side if needed
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            return res.status(400).json({ error: error.message })
          }

          return res.status(200).json({ 
            user: data.user,
            session: data.session
          })
        }

        return res.status(400).json({ error: 'Invalid action' })
      } catch (error: any) {
        return res.status(500).json({ error: error.message })
      }

    case 'DELETE':
      try {
        // Logout user - Note: This should typically be handled client-side
        // using supabase.auth.signOut()
        const { session_id } = req.body

        if (!session_id) {
          return res.status(400).json({ error: 'Missing session ID' })
        }

        const { error } = await supabase.auth.admin.signOut(session_id)

        if (error) {
          return res.status(400).json({ error: error.message })
        }

        return res.status(200).json({ success: true })
      } catch (error: any) {
        return res.status(500).json({ error: error.message })
      }

    default:
      res.setHeader('Allow', ['POST', 'DELETE'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
} 