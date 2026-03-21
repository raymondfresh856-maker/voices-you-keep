const { getSupabaseAdmin, handleOptions, jsonResponse, authenticateRequest } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const auth = authenticateRequest(event);
  if (auth.error) return auth.error;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .single();

    if (error || !profile) {
      // Profile missing — create it now so the user isn't permanently locked out
      // Real schema: id, email, display_name, tier (no usage counters)
      const { data: newProfile, error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: auth.user.id,
          email: auth.user.email,
          display_name: auth.user.email,
          tier: 'free',
        }, { onConflict: 'id' })
        .select()
        .single();

      if (upsertError || !newProfile) {
        console.error('Profile auto-create failed:', upsertError && (upsertError.message || JSON.stringify(upsertError)));
        return jsonResponse(404, { error: 'Profile not found' });
      }

      return jsonResponse(200, {
        user: {
          id: newProfile.id,
          name: newProfile.display_name || newProfile.email,
          email: newProfile.email,
          tier: newProfile.tier || 'free',
          cardsUsedThisMonth: 0,
          cardsUsedLifetime: 0,
        },
      });
    }

    const user = {
      id: profile.id,
      name: profile.display_name || profile.email,
      email: profile.email,
      tier: profile.tier || 'free',
      cardsUsedThisMonth: 0,
      cardsUsedLifetime: 0,
    };

    return jsonResponse(200, { user });
  } catch (err) {
    console.error('Auth me error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
