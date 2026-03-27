import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller is a super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Verify caller's role using their JWT
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is super_admin
    const { data: hasRole } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "super_admin",
    });
    if (!hasRole) throw new Error("Only super admins can create users");

    const { full_name, phone, password, role, store_id } = await req.json();

    if (!full_name?.trim() || !phone?.trim()) {
      throw new Error("Name and phone are required");
    }

    const email = `${phone.replace(/\D/g, "")}@ops.biryaan.app`;

    // Create user with admin API (doesn't affect caller's session)
    const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: password || "111111",
      email_confirm: true,
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "User with this phone already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createErr;
    }

    const userId = authData.user.id;

    // Update profile
    await adminClient.from("profiles").update({
      full_name: full_name.trim(),
      phone: phone.trim(),
    }).eq("user_id", userId);

    // Remove any auto-assigned role from trigger
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
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
