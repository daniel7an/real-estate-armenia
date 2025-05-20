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
      // GET /api/inquiries?propertyId=xxx - Get inquiries for a property
      // GET /api/inquiries?userId=xxx - Get inquiries sent by a user
      try {
        // Ensure user is authenticated
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const { propertyId, userId: queryUserId } = req.query

        let query = supabase.from('inquiries').select(`
          id, 
          message, 
          created_at,
          property (id, title, city, price, image_url),
          sender (id, email)
        `)

        if (propertyId) {
          // Get inquiries for a specific property
          // First check if user owns the property
          const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .select('owner')
            .eq('id', propertyId)
            .single()

          if (propertyError) {
            throw propertyError
          }

          if (!propertyData || propertyData.owner !== userId) {
            return res.status(403).json({ error: 'Forbidden - You do not own this property' })
          }

          query = query.eq('property', propertyId)
        } else if (queryUserId) {
          // Get inquiries sent by a specific user
          // Users can only see their own inquiries
          if (queryUserId !== userId) {
            return res.status(403).json({ error: 'Forbidden - You can only view your own inquiries' })
          }

          query = query.eq('sender', queryUserId)
        } else {
          // Get all inquiries related to the user
          // Either as a sender or as a property owner
          const { data: propertiesOwned, error: propertiesError } = await supabase
            .from('properties')
            .select('id')
            .eq('owner', userId)

          if (propertiesError) {
            throw propertiesError
          }

          const propertyIds = propertiesOwned?.map(p => p.id) || []

          query = query.or(`sender.eq.${userId},property.in.(${propertyIds.join(',')})`)
        }

        // Order by creation date, newest first
        query = query.order('created_at', { ascending: false })

        const { data, error } = await query

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

    case 'POST':
      // POST /api/inquiries - Create a new inquiry
      try {
        // Ensure user is authenticated
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const { property, message } = req.body

        if (!property || !message) {
          return res.status(400).json({ error: 'Missing required fields' })
        }

        // First, check if the property exists
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', property)
          .single()

        if (propertyError) {
          throw propertyError
        }

        if (!propertyData) {
          return res.status(404).json({ error: 'Property not found' })
        }

        // Don't allow users to send inquiries to their own properties
        if (propertyData.owner === userId) {
          return res.status(400).json({ error: 'You cannot send an inquiry to your own property' })
        }

        // Create the inquiry
        const { data, error } = await supabase
          .from('inquiries')
          .insert([
            {
              property,
              sender: userId,
              message,
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

    case 'DELETE':
      // DELETE /api/inquiries?id=xxx - Delete an inquiry
      try {
        const { id } = req.query

        if (!id) {
          return res.status(400).json({ error: 'Missing inquiry ID' })
        }

        // Ensure user is authenticated
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        // First, check if the user is authorized to delete this inquiry
        const { data: inquiryData, error: inquiryError } = await supabase
          .from('inquiries')
          .select(`
            sender,
            property (
              owner
            )
          `)
          .eq('id', id)
          .single()

        if (inquiryError) {
          throw inquiryError
        }

        // Check if the property and its owner match the user ID
        let propertyOwnerId = null

        // Safely access the property owner
        if (inquiryData && inquiryData.property) {
          // Use a type assertion with unknown first
          const property = inquiryData.property as unknown;
          
          if (Array.isArray(property) && property.length > 0 && 'owner' in property[0]) {
            propertyOwnerId = property[0].owner;
          } else if (typeof property === 'object' && property !== null && 'owner' in (property as object)) {
            propertyOwnerId = (property as {owner: string}).owner;
          }
        }

        const isAuthorized = inquiryData.sender === userId || propertyOwnerId === userId

        if (!isAuthorized) {
          return res.status(403).json({ error: 'Forbidden - You are not authorized to delete this inquiry' })
        }

        // Delete the inquiry
        const { error } = await supabase
          .from('inquiries')
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
      res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
} 