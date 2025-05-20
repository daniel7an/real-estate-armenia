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

  // Get the user ID from the authorization header (if present)
  // In a real app, you'd want to verify JWT or session
  // This is a simplified example
  let userId = null
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const { data, error } = await supabase.auth.getUser(token)
      if (error) throw error
      userId = data.user?.id
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  switch (method) {
    case 'GET':
      // GET /api/properties - List properties
      // GET /api/properties?id=xxx - Get a single property
      // GET /api/properties?ownerId=xxx - Get properties for an owner
      try {
        const { id, ownerId } = req.query

        if (id) {
          // Get a single property by ID
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single()

          if (error) {
            throw error
          }

          return res.status(200).json(data)
        } else if (ownerId) {
          // Get properties for a specific owner
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('owner', ownerId)
            .order('created_at', { ascending: false })

          if (error) {
            throw error
          }

          return res.status(200).json(data)
        } else {
          // Get all properties (perhaps limit or add pagination)
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

          if (error) {
            throw error
          }

          return res.status(200).json(data)
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          return res.status(500).json({ error: error.message })
        }
        return res.status(500).json({ error: 'An unknown error occurred' })
      }

    case 'POST':
      // POST /api/properties - Create a new property
      try {
        // Ensure user is authenticated
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const { title, city, price, image_url } = req.body

        if (!title || !city || price === undefined) {
          return res.status(400).json({ error: 'Missing required fields' })
        }

        // Create new property
        const { data, error } = await supabase
          .from('properties')
          .insert([
            {
              title,
              city,
              price,
              image_url: image_url || null,
              owner: userId,
            },
          ])
          .select()

        if (error) {
          throw error
        }

        return res.status(201).json(data)
      } catch (error: unknown) {
        if (error instanceof Error) {
          return res.status(500).json({ error: error.message })
        }
        return res.status(500).json({ error: 'An unknown error occurred' })
      }

    case 'PUT':
      // PUT /api/properties?id=xxx - Update a property
      try {
        const { id } = req.query

        if (!id) {
          return res.status(400).json({ error: 'Missing property ID' })
        }

        // Ensure user is authenticated
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        // First, check if the user owns this property
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('owner')
          .eq('id', id)
          .single()

        if (propertyError) {
          throw propertyError
        }

        if (!propertyData || propertyData.owner !== userId) {
          return res.status(403).json({ error: 'Forbidden - You do not own this property' })
        }

        // Update the property
        const { title, city, price, image_url } = req.body

        const { data, error } = await supabase
          .from('properties')
          .update({
            title,
            city,
            price,
            image_url,
            // Do not update owner
          })
          .eq('id', id)
          .select()

        if (error) {
          throw error
        }

        return res.status(200).json(data)
      } catch (error: unknown) {
        if (error instanceof Error) {
          return res.status(500).json({ error: error.message })
        }
        return res.status(500).json({ error: 'An unknown error occurred' })
      }

    case 'DELETE':
      // DELETE /api/properties?id=xxx - Delete a property
      try {
        const { id } = req.query

        if (!id) {
          return res.status(400).json({ error: 'Missing property ID' })
        }

        // Ensure user is authenticated
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        // First, check if the user owns this property
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('owner')
          .eq('id', id)
          .single()

        if (propertyError) {
          throw propertyError
        }

        if (!propertyData || propertyData.owner !== userId) {
          return res.status(403).json({ error: 'Forbidden - You do not own this property' })
        }

        // Delete the property
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', id)

        if (error) {
          throw error
        }

        return res.status(200).json({ success: true })
      } catch (error: unknown) {
        if (error instanceof Error) {
          return res.status(500).json({ error: error.message })
        }
        return res.status(500).json({ error: 'An unknown error occurred' })
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
} 