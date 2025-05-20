import { useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Property = {
  id: string
  title: string
  city: string
  price: number
  image_url: string
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6)

        if (error) {
          throw error
        }

        if (data) {
          setProperties(data)
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Armenian Real Estate</title>
        <meta name="description" content="Find your dream home in Armenia" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Armenian Real Estate</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-gray-900 hover:text-gray-700">
              Home
            </Link>
            <Link href="/register" className="text-gray-900 hover:text-gray-700">
              Register
            </Link>
            <Link href="/dashboard" className="text-gray-900 hover:text-gray-700">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-lg h-96 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1597575732103-9f6d520143d1?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}>
            <div className="h-full flex items-center justify-center backdrop-blur-sm bg-black/30">
              <div className="text-center text-white">
                <h2 className="text-4xl font-bold mb-4">Find Your Dream Home in Armenia</h2>
                <p className="text-xl mb-6">Browse our curated selection of properties</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Properties</h2>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading properties...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.length > 0 ? (
                properties.map((property) => (
                  <Link key={property.id} href={`/listings/${property.id}`} className="block">
                    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
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
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-600">No properties found. Check back soon!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">© {new Date().getFullYear()} Armenian Real Estate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
