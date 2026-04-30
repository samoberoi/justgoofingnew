// Delete the authenticated user's account and all associated data.
// Apple App Store Guideline 5.1.1(v) compliance: account deletion in-app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller via their JWT
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Admin client for deletes
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Best-effort wipe of user-owned rows (no FK cascade in this schema)
    const tables = [
      "kids",
      "addresses",
      "bookings",
      "play_sessions",
      "orders",
      "points_transactions",
      "user_badges",
      "referrals",
      "rider_locations",
      "user_roles",
      "profiles",
    ];
    for (const t of tables) {
      try {
        if (t === "referrals") {
          await admin.from(t).delete().or(`referrer_id.eq.${userId},referee_id.eq.${userId}`);
        } else if (t === "rider_locations") {
          await admin.from(t).delete().eq("rider_id", userId);
        } else if (t === "kids") {
          await admin.from(t).delete().eq("parent_user_id", userId);
        } else {
          await admin.from(t).delete().eq("user_id", userId);
        }
      } catch (e) {
        console.error(`delete ${t} failed`, e);
      }
    }

    // Remove profile pictures from storage
    try {
      const { data: files } = await admin.storage
        .from("profile-pictures")
        .list(userId);
      if (files && files.length) {
        await admin.storage
          .from("profile-pictures")
          .remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch (e) {
      console.error("storage cleanup failed", e);
    }

    // Finally delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
