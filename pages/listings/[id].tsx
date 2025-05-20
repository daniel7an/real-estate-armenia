import { useState } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

type Property = {
  id: string
  title: string
  city: string
  price: number
  image_url: string
  owner: string
}

type Inquiry = {
  message: string
}

type Props = {
  property: Property | null
}

export default function PropertyDetails({ property }: Props) {
  const router = useRouter()
  const [inquiry, setInquiry] = useState<Inquiry>({ message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Property Not Found</h1>
          <p className="text-gray-600 mb-6">The property you are looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setInquiry({ ...inquiry, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to send an inquiry')
        return router.push('/register')
      }

      // Send inquiry
      const { error: inquiryError } = await supabase
        .from('inquiries')
        .insert([
          {
            property: property.id,
            sender: user.id,
            message: inquiry.message
          }
        ])

      if (inquiryError) {
        throw inquiryError
      }

      setSuccess(true)
      setInquiry({ message: '' })
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Failed to send inquiry. Please try again.')
      } else {
        setError('Failed to send inquiry. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>{property.title} | Armenian Real Estate</title>
        <meta name="description" content={`${property.title} - ${property.city}, Armenia`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            <Link href="/" className="hover:text-gray-700">
              Armenian Real Estate
            </Link>
          </h1>
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="h-96 bg-gray-200 relative">
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
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h2>
              <p className="text-2xl font-semibold text-blue-600">${property.price.toLocaleString()}</p>
            </div>
            <p className="mt-2 text-lg text-gray-600">{property.city}, Armenia</p>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Send an Inquiry</h3>
              
              {success ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  Your inquiry has been sent successfully! The property owner will contact you soon.
                </div>
              ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              ) : null}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="message" className="block text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="I'm interested in this property. Please contact me for a viewing."
                    value={inquiry.message}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {submitting ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            </div>
          </div>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return {
      props: {
        property: null
      }
    }
  }

  return {
    props: {
      property: data
    }
  }
} 