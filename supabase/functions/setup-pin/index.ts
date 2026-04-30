// Sets up a new user account with phone, email, and PIN.
// Creates the auth user (deterministic password from phone), inserts profile with hashed PIN.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, email, pin } = await req.json();

    if (!/^\d{10}$/.test(phone || '')) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!/^\S+@\S+\.\S+$/.test(email || '')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!/^\d{4}$/.test(pin || '')) {
      return new Response(JSON.stringify({ error: 'PIN must be 4 digits' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authEmail = `${phone}@ops.justgoofing.app`;
    const password = `${phone}-justgoofing-2024`;
    const pinHash = await sha256(pin + PIN_SALT);

    // Create auth user (idempotent: if exists we still update profile)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { phone },
    });

    let userId = created?.user?.id;

    if (createErr && !userId) {
      // user likely exists already — find them
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((u: any) => u.email === authEmail);
      if (existing) {
        userId = existing.id;
        // reset password to deterministic
        await admin.auth.admin.updateUserById(userId, { password });
      } else {
        return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Upsert profile with phone, email, pin_hash
    const { error: profErr } = await admin.from('profiles').upsert({
      user_id: userId,
      phone,
      email,
      pin_hash: pinHash,
    }, { onConflict: 'user_id' });

    if (profErr) {
      return new Response(JSON.stringify({ error: profErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
