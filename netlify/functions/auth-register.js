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
      // Handle duplicate email
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return jsonResponse(409, { error: 'An account with this email already exists' });
      }
      return jsonResponse(400, { error: authError.message });
    }

    if (!authData.user) {
      return jsonResponse(500, { error: 'Failed to create user' });
    }

    // Create profile in profiles table
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      tier: 'FREE',
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the registration — profile can be created on first login
    }

    // Sign our own JWT
    const token = signToken({
      id: authData.user.id,
      email: authData.user.email,
    });

    const user = {
      id: authData.user.id,
      name: name.trim(),
      email: authData.user.email,
      tier: 'FREE',
      cardsUsedThisMonth: 0,
      cardsUsedLifetime: 0,
    };

    return jsonResponse(200, { token, user });
  } catch (err) {
    console.error('Registration error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
