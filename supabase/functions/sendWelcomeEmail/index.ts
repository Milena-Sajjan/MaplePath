import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, name, status_type, city, nextSteps } = await req.json()
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    await resend.emails.send({
      from: 'MaplePath <hello@maplepath.ca>',
      to: email,
      subject: `Welcome to MaplePath, ${name}!`,
      html: `
        <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1A3A2A; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; font-size: 28px; margin: 0;">Welcome to MaplePath</h1>
            <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">
              Your Canadian settlement journey starts here
            </p>
          </div>
          <div style="background: #F8F6F2; padding: 32px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #2C2C2C;">Hi ${name},</p>
            <p>Welcome to Canada! We've set up your personalized settlement roadmap for ${city}.</p>
            <h3 style="color: #1A3A2A;">Your next 3 steps:</h3>
            <ol style="color: #2C2C2C; line-height: 2;">
              ${nextSteps.map((s: string) => `<li>${s}</li>`).join('')}
            </ol>
            <a href="https://maplepath.ca"
               style="display: inline-block; background: #C8102E; color: white;
                      padding: 14px 28px; border-radius: 8px; text-decoration: none;
                      font-weight: 600; margin-top: 20px;">
              Open MaplePath
            </a>
            <p style="margin-top: 24px; color: #6B7280; font-size: 13px;">
              Questions? Just reply to this email or chat with SettlerWiz 24/7.
            </p>
          </div>
        </div>
      `,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
