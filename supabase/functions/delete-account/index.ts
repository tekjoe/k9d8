import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a user-scoped client to verify the JWT
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid JWT' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const uid = user.id;

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Delete storage files via Storage API
    for (const bucket of ['user-avatars', 'dog-photos']) {
      const { data: files } = await supabaseAdmin.storage
        .from(bucket)
        .list(uid);

      if (files && files.length > 0) {
        const paths = files.map((f: { name: string }) => `${uid}/${f.name}`);
        await supabaseAdmin.storage.from(bucket).remove(paths);
      }
    }

    // 2. Delete the auth user (CASCADE on auth.users handles all public table data)
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(uid);

    if (deleteError) {
      console.error('Failed to delete user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
