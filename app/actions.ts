'use server'

import { supabase } from './lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 1. Define the Zod validation schema
const observationSchema = z.object({
  category: z.enum(['Odor', 'Smoke/Haze', 'Runoff/Water', 'Dust/Particles', 'Noise']),
  intensity: z.coerce.number().min(1).max(5).optional().nullable(),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional().nullable(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
})

export async function createObservation(formData: FormData) {
  // Extract data from form
  const rawData = {
    category: formData.get('category'),
    intensity: formData.get('intensity'),
    notes: formData.get('notes'),
    latitude: formData.get('latitude') || 0.0,
    longitude: formData.get('longitude') || 0.0,
  }

  // 2. Validate data against schema
  const validationResult = observationSchema.safeParse(rawData)
  if (!validationResult.success) {
    console.error('Zod Validation Error:', validationResult.error.format())
    return { success: false, error: 'Invalid input data. Please check your submission fields.' }
  }

  const { category, intensity, notes, latitude, longitude } = validationResult.data

  // 3. Get the currently logged-in user
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Insert validated data into Supabase
  const { error: insertError } = await supabase
    .from('observations')
    .insert([
      { 
        category, 
        intensity, 
        notes,
        reported_timing: 'Now',
        private_latitude: latitude,
        private_longitude: longitude,
        owner_id: user ? user.id : null
      }
    ])

  if (insertError) {
    console.error('Supabase Error:', insertError.message)
    return { success: false, error: insertError.message }
  }

  revalidatePath('/')
  return { success: true }
}