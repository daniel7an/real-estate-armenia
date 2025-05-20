import { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'

type Property = {
  id: string
  title: string
  city: string
  price: number
  image_url: string
}

type PropertyFormData = {
  title: string
  city: string
  price: string
  image_url: string
}

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    city: '',
    price: '',
    image_url: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
      
      if (!session) {
        router.push('/register')
      } else {
        fetchProperties(session.user.id)
      }
    }
    
    checkSession()
  }, [router])

  const fetchProperties = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (data) setProperties(data)
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    
    if (!session) {
      setFormError('You must be logged in')
      return
    }
    
    try {
      const propertyData = {
        title: formData.title,
        city: formData.city,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        owner: session.user.id
      }
      
      if (isEditing && currentPropertyId) {
        // Update existing property
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', currentPropertyId)
        
        if (error) throw error
        
        setSuccessMessage('Property updated successfully')
      } else {
        // Insert new property
        const { error } = await supabase
          .from('properties')
          .insert([propertyData])
        
        if (error) throw error
        
        setSuccessMessage('Property added successfully')
      }
      
      // Reset form
      setFormData({
        title: '',
        city: '',
        price: '',
        image_url: ''
      })
      setIsEditing(false)
      setCurrentPropertyId(null)
      
      // Refresh properties list
      fetchProperties(session.user.id)
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFormError(error.message || 'Failed to save property')
      } else {
        setFormError('Failed to save property')
      }
    }
  }

  const handleEdit = (property: Property) => {
    setFormData({
      title: property.title,
      city: property.city,
      price: property.price.toString(),
      image_url: property.image_url
    })
    setIsEditing(true)
    setCurrentPropertyId(property.id)
    setFormError(null)
    setSuccessMessage(null)
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Refresh properties list
      if (session) {
        fetchProperties(session.user.id)
      }
      setSuccessMessage('Property deleted successfully')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFormError(error.message || 'Failed to delete property')
      } else {
        setFormError('Failed to delete property')
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If no session, show not authenticated message (although useEffect should redirect)
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authenticated</h1>
          <p className="text-gray-600 mb-6">You need to log in to access the dashboard.</p>
          <Link href="/register" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Register / Log In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Dashboard | Armenian Real Estate</title>
        <meta name="description" content="Manage your properties on Armenian Real Estate" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            <Link href="/" className="hover:text-gray-700">
              Armenian Real Estate
            </Link>
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{session.user.email}</span>
            <button 
              onClick={handleLogout}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditing ? 'Edit Property' : 'Add New Property'}
          </h2>
          
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="title" className="block text-gray-700 mb-2">
                    Property Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="city" className="block text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="price" className="block text-gray-700 mb-2">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="image_url" className="block text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  {isEditing ? 'Update Property' : 'Add Property'}
                </button>
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        title: '',
                        city: '',
                        price: '',
                        image_url: ''
                      })
                      setIsEditing(false)
                      setCurrentPropertyId(null)
                    }}
                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Properties</h2>
          
          {properties.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">You haven&apos;t added any properties yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="h-48 bg-gray-200 relative">
                    {property.image_url ? (
                      <Image
                        src={property.image_url}
                        alt={property.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gray-100">
                        <p className="text-gray-500">No image available</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">{property.title}</h3>
                    <p className="mt-1 text-gray-500">{property.city}</p>
                    <p className="mt-2 text-lg font-semibold">${property.price.toLocaleString()}</p>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleEdit(property)}
                        className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <Link
                        href={`/listings/${property.id}`}
                        className="bg-gray-200 text-gray-800 py-1 px-3 rounded hover:bg-gray-300"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">© {new Date().getFullYear()} Armenian Real Estate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 