// supabase/functions/user-registered-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

console.log('User Registered Webhook function booting up...')

// Define the expected structure of the incoming webhook payload (specifically the profile record)
interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  // Add other fields from your 'profiles' table if needed by the notification service
}

// Define the structure of the event we want to send
interface UserRegisteredEvent {
  eventType: 'USER_REGISTERED';
  userId: string;
  email: string | null;
  firstName: string | null;
  timestamp: string;
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight requests (essential for browsers, good practice)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
        'Access-Control-Allow-Origin': '*', // Adjust in production
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    // 2. Parse the incoming request body from the Supabase webhook trigger
    // The payload structure for an INSERT trigger: { type: 'INSERT', table: 'profiles', record: { ... } }
    const payload = await req.json()
    console.log('Received webhook payload:', payload)

    // 3. Validate payload and extract the new profile record
    if (payload.type !== 'INSERT' || !payload.record) {
        console.warn('Received non-INSERT payload or missing record:', payload)
        return new Response('Payload format error: Expected INSERT event with record.', { status: 400 })
    }
    const profile: Profile = payload.record;

    // Basic check for essential data
    if (!profile.id || !profile.email) {
        console.error('Missing essential data (id or email) in profile record:', profile)
        return new Response('Bad Data: Profile record missing id or email.', { status: 400 })
    }

    // 4. Construct the event payload to send onwards
    const eventData: UserRegisteredEvent = {
      eventType: 'USER_REGISTERED',
      userId: profile.id,
      email: profile.email,
      firstName: profile.first_name, // Include first name for personalization
      timestamp: new Date().toISOString(),
    }
    console.log('Constructed event data:', eventData)

    // 5. Send the event data to the Notification Service
    // IMPORTANT: Get the Notification service URL from environment variables
    // You will need to set this variable later using Supabase secrets!
    const notificationUrl = Deno.env.get('NOTIFICATION_SERVICE_URL')

    if (!notificationUrl) {
      console.error('NOTIFICATION_SERVICE_URL environment variable is not set!')
      // Don't fail the webhook, just log the error for now.
      // Alternatively, you could return a 500 error here.
    } else {
        console.log(`Sending event to Notification Service at: ${notificationUrl}`)
        try {
            const response = await fetch(notificationUrl, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                // TODO: Add authorization header if your notification service requires it
                },
                body: JSON.stringify(eventData),
            })

            if (!response.ok) {
                // Log error if the notification service responds with non-2xx status
                const responseBody = await response.text();
                console.error(`Notification Service responded with status ${response.status}:`, responseBody)
                // Decide if webhook should fail here - maybe not, registration still succeeded.
            } else {
                console.log(`Successfully sent event to Notification Service. Status: ${response.status}`)
            }
        } catch (fetchError) {
            console.error('Error calling Notification Service:', fetchError)
            // Decide if webhook should fail here - maybe not.
        }
    }


    // 6. Return a success response to Supabase to acknowledge the webhook
    return new Response(JSON.stringify({ message: 'Webhook processed, event forwarded (if URL configured).' }), {
      headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Adjust in production
      },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(`Webhook processing error: ${error.message}`, { status: 500 })
  }
})