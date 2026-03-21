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
      const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();
      const { data: newProfile, error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: auth.user.id,
          name: auth.user.email,
          email: auth.user.email,
          tier: 'FREE',
          cards_used_this_month: 0,
          cards_used_lifetime: 0,
          month_reset_at: nextMonth,
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
          name: newProfile.name,
          email: newProfile.email,
          tier: newProfile.tier,
          cardsUsedThisMonth: 0,
          cardsUsedLifetime: 0,
        },
      });
    }

    // Check monthly reset
    let cardsUsedThisMonth = profile.cards_used_this_month;
    if (new Date(profile.month_reset_at) <= new Date()) {
      cardsUsedThisMonth = 0;
      await supabaseAdmin.from('profiles').update({
        cards_used_this_month: 0,
        month_reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      }).eq('id', auth.user.id);
    }

    const user = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      tier: profile.tier,
      cardsUsedThisMonth,
      cardsUsedLifetime: profile.cards_used_lifetime,
    };

    return jsonResponse(200, { user });
  } catch (err) {
    console.error('Auth me error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
