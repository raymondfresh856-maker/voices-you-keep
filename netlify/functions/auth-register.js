const { getSupabaseClient, getSupabaseAdmin, handleOptions, jsonResponse, signToken, parseBody } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const { name, email, password } = parseBody(event);

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return jsonResponse(400, { error: 'Name is required' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return jsonResponse(400, { error: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return jsonResponse(400, { error: 'Password must be at least 8 characters' });
  }

  try {
    const supabase = getSupabaseClient();
    const supabaseAdmin = getSupabaseAdmin();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (authError) {
      // Defensive: Supabase sometimes uses .message, sometimes .msg
      const errMsg = authError.message || authError.msg || String(authError) || 'Authentication failed';
      if (
        errMsg.includes('already registered') ||
        errMsg.includes('already been registered') ||
        errMsg.includes('already exists')
      ) {
        return jsonResponse(409, { error: 'An account with this email already exists' });
      }
      return jsonResponse(400, { error: errMsg });
    }

    // Supabase with email confirmation returns user but null session
    // We issue our own JWT so this is fine either way
    const user = authData && authData.user;

    if (!user || !user.id) {
      // Account may need email confirmation — treat as partial success
      return jsonResponse(200, {
        requiresEmailConfirmation: true,
        message: 'Account created! Check your email to confirm, then log in.',
        token: null,
        user: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          tier: 'FREE',
          cardsUsedThisMonth: 0,
          cardsUsedLifetime: 0,
        },
      });
    }

    // Create profile row — actual schema: id, email, display_name, tier
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: email.trim().toLowerCase(),
      display_name: name.trim(),
      tier: 'free',
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile upsert error:', profileError.message || JSON.stringify(profileError));
    }

    // Issue our own JWT
    const token = signToken({ id: user.id, email: user.email });

    return jsonResponse(200, {
      token,
      user: {
        id: user.id,
        name: name.trim(),
        email: user.email,
        tier: 'free',
        cardsUsedThisMonth: 0,
        cardsUsedLifetime: 0,
      },
    });
  } catch (err) {
    const msg = (err && (err.message || err.msg)) ? (err.message || err.msg) : String(err);
    console.error('Registration error:', msg);
    return jsonResponse(500, { error: 'Registration failed: ' + msg });
  }
};
