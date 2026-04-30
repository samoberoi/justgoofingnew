// Generates a new 4-digit PIN, updates profile, emails it via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const PIN_SALT = 'just-goofing-pin-salt-v1';
const FROM_ADDRESS = 'Just Goofing <noreply@hyperrevamp.com>';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone } = await req.json();
    if (!/^\d{10}$/.test(phone || '')) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('user_id, email')
      .eq('phone', phone)
      .maybeSingle();

    if (pErr || !profile) {
      return new Response(JSON.stringify({ error: 'No account found for this phone' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!profile.email) {
      return new Response(JSON.stringify({ error: 'No recovery email on file' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate new 4-digit PIN
    const newPin = String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await sha256(newPin + PIN_SALT);

    const { error: upErr } = await admin
      .from('profiles')
      .update({ pin_hash: pinHash })
      .eq('user_id', profile.user_id);

    if (upErr) {
      return new Response(JSON.stringify({ error: 'Failed to reset PIN' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Send email via Resend
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;">
        <h1 style="color:#111;font-size:22px;margin:0 0 16px;">Your new Just Goofing PIN 🎉</h1>
        <p style="color:#444;font-size:14px;line-height:1.5;">Hi! You asked to reset your PIN. Use the new PIN below to log in:</p>
        <div style="margin:24px 0;padding:20px;background:#fff5f1;border:2px dashed #ff6b6b;border-radius:12px;text-align:center;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;">${newPin}</span>
        </div>
        <p style="color:#666;font-size:13px;line-height:1.5;">For your security, change this PIN inside the app once you're logged in. If you didn't request this, ignore this email — your account is safe.</p>
        <p style="color:#999;font-size:12px;margin-top:32px;">— The Just Goofing Team</p>
      </div>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [profile.email],
        subject: 'Your new Just Goofing PIN',
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error('Resend failed:', err);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mask email for response
    const [local, domain] = profile.email.split('@');
    const masked = local.slice(0, 2) + '***@' + domain;

    return new Response(JSON.stringify({ success: true, sentTo: masked }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
