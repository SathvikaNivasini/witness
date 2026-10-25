'use client'

import { useActionState, useEffect, useRef, useState, startTransition } from 'react'
import { createObservation } from './actions'

const initialState = {
  success: false,
  error: null as string | null,
}

export default function Home() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await createObservation(formData)
  }, initialState)

  const formRef = useRef<HTMLFormElement>(null)
  const [locationStatus, setLocationStatus] = useState<string>('')

  // Clear form when successfully submitted
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      setLocationStatus('Report submitted successfully with your location!')
    }
  }, [state])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formElement = e.currentTarget
    const formData = new FormData(formElement)

    setLocationStatus('Getting your location...')

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          formData.append('latitude', position.coords.latitude.toString())
          formData.append('longitude', position.coords.longitude.toString())
          setLocationStatus('')
          startTransition(() => {
            formAction(formData)
          })
        },
        (error) => {
          console.warn('Geolocation denied or failed:', error.message)
          formData.append('latitude', '0.0')
          formData.append('longitude', '0.0')
          setLocationStatus('Location unavailable. Submitted with default coordinates.')
          startTransition(() => {
            formAction(formData)
          })
        },
        { timeout: 10000 }
      )
    } else {
      formData.append('latitude', '0.0')
      formData.append('longitude', '0.0')
      startTransition(() => {
        formAction(formData)
      })
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Witness - Submit Observation</h1>
      
      {/* Success or Error Banners */}
      {state?.success && (
        <div style={{ background: '#e6ffed', border: '1px solid #b7eb8f', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#52c41a' }}>
          {locationStatus || 'Report submitted successfully!'}
        </div>
      )}
      {state?.error && (
        <div style={{ background: '#fff2f0', border: '1px solid #ffcccb', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#ff4d4f' }}>
          Error: {state.error}
        </div>
      )}

      {locationStatus && !state?.success && (
        <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>{locationStatus}</p>
      )}

      {/* Submission Form */}
      <form 
        ref={formRef}
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}
      >
        <label>
          Category:
          <select name="category" required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}>
            <option value="Odor">Odor</option>
            <option value="Smoke/Haze">Smoke/Haze</option>
            <option value="Runoff/Water">Runoff/Water</option>
            <option value="Dust/Particles">Dust/Particles</option>
            <option value="Noise">Noise</option>
          </select>
        </label>

        <label>
          Intensity (1-5):
          <input type="number" name="intensity" min="1" max="5" defaultValue="3" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
        </label>

        <label>
          Notes:
          <textarea name="notes" placeholder="Describe what you see or smell..." style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
        </label>

        <button 
          type="submit" 
          disabled={isPending}
          style={{ padding: '0.75rem', cursor: 'pointer', background: isPending ? '#ccc' : '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
        >
          {isPending ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </main>
  )
}