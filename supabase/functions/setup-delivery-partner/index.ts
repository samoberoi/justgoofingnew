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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const email = "7777777777@ops.biryaan.app";
    const password = "7777777777-biryaan-2024";
    const phone = "7777777777";

    // Try to create user
    let userId: string;
    const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        // Find existing user
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const existing = users?.find((u: any) => u.email === email);
        if (!existing) {
          return new Response(JSON.stringify({ error: "User exists but not found" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = existing.id;
        // Reset password
        await adminClient.auth.admin.updateUserById(userId, { password });
      } else {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      userId = authData.user.id;
    }

    // Update profile
    await adminClient.from("profiles").update({
      full_name: "Delivery Partner",
      phone,
    }).eq("user_id", userId);

    // Remove any existing roles
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // Get first active store
    const { data: stores } = await adminClient.from("stores").select("id").eq("is_active", true).limit(1);
    const storeId = stores?.[0]?.id || null;

    // Assign delivery_partner role
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role: "delivery_partner",
      store_id: storeId,
      is_active: true,
    });

    return new Response(
      JSON.stringify({ success: true, user_id: userId, store_id: storeId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
