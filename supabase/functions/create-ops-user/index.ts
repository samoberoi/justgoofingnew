import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await adminClient.auth.getUser(token);
    
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hasRole } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "super_admin",
    });
    
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Only super admins can create users" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { full_name, phone, password, role, store_id, designation, pan_number, aadhaar_number, start_date, salary } = await req.json();

    if (!full_name?.trim() || !phone?.trim()) {
      return new Response(JSON.stringify({ error: "Name and phone are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = `${phone.replace(/\D/g, "")}@ops.biryaan.app`;

    const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: password || "111111",
      email_confirm: true,
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ error: "User with this phone already exists" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Update profile with all fields
    await adminClient.from("profiles").update({
      full_name: full_name.trim(),
      phone: phone.trim(),
      designation: designation?.trim() || null,
      pan_number: pan_number?.trim() || null,
      aadhaar_number: aadhaar_number?.trim() || null,
      start_date: start_date || null,
      salary: salary || null,
    }).eq("user_id", userId);

    // Remove any auto-assigned role
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // Insert correct role
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role,
      store_id: store_id || null,
      is_active: true,
    });

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
