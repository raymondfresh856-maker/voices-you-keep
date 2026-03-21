const { getSupabaseClient, getSupabaseAdmin, handleOptions, jsonResponse, signToken, parseBody } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const { email, password } = parseBody(event);

  if (!email || !password) {
    return jsonResponse(400, { error: 'Email and password are required' });
  }

  try {
    const supabase = getSupabaseClient();
    const supabaseAdmin = getSupabaseAdmin();

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      return jsonResponse(401, { error: 'Invalid email or password' });
    }

    if (!authData.user) {
      return jsonResponse(401, { error: 'Invalid email or password' });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Real schema: id, email, display_name, tier (no usage counters)
    let tier = 'free';
    let cardsUsedThisMonth = 0;
    let cardsUsedLifetime = 0;
    let name = authData.user.user_metadata?.name || authData.user.email;

    if (profile && !profileError) {
      tier = profile.tier || 'free';
      name = profile.display_name || profile.email;
    }

    // Sign JWT
    const token = signToken({
      id: authData.user.id,
      email: authData.user.email,
    });

    const user = {
      id: authData.user.id,
      name,
      email: authData.user.email,
      tier,
      cardsUsedThisMonth,
      cardsUsedLifetime,
    };

    return jsonResponse(200, { token, user });
  } catch (err) {
    console.error('Login error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
