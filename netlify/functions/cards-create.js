const { getSupabaseAdmin, handleOptions, jsonResponse, authenticateRequest, parseBody } = require('./utils/supabase');

// Tier limits
const TIER_LIMITS = {
  FREE: { monthlyCards: 3, isLifetime: true },
  KEEPER: { monthlyCards: 10, isLifetime: false },
  LEGACY: { monthlyCards: Infinity, isLifetime: false },
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const auth = authenticateRequest(event);
  if (auth.error) return auth.error;

  const { themeId, title, message, senderName, recipientName, recipientEmail } = parseBody(event);

  // Validation
  if (!themeId) return jsonResponse(400, { error: 'Theme ID is required' });
  if (!recipientName || recipientName.trim().length < 1) {
    return jsonResponse(400, { error: 'Recipient name is required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse(404, { error: 'User profile not found' });
    }

    // Check monthly reset
    let cardsUsed = profile.cards_used_this_month;
    if (new Date(profile.month_reset_at) <= new Date()) {
      cardsUsed = 0;
      await supabaseAdmin.from('profiles').update({
        cards_used_this_month: 0,
        month_reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      }).eq('id', auth.user.id);
    }

    // Check tier limits
    const limit = TIER_LIMITS[profile.tier] || TIER_LIMITS.FREE;
    const countToCheck = limit.isLifetime ? profile.cards_used_lifetime : cardsUsed;
    const maxCards = limit.isLifetime ? limit.monthlyCards : limit.monthlyCards;

    if (countToCheck >= maxCards) {
      return jsonResponse(403, {
        error: `You've reached your ${limit.isLifetime ? 'lifetime' : 'monthly'} card limit (${maxCards}). Upgrade to send more!`,
        upgradeRequired: true,
      });
    }

    // Create card
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .insert({
        user_id: auth.user.id,
        theme_id: themeId,
        title: title || 'Voice Message Card',
        message: message || '',
        sender_name: senderName || profile.name,
        recipient_name: recipientName.trim(),
        recipient_email: recipientEmail ? recipientEmail.trim().toLowerCase() : null,
        status: 'draft',
      })
      .select()
      .single();

    if (cardError) {
      console.error('Card creation error:', cardError);
      return jsonResponse(500, { error: 'Failed to create card' });
    }

    // Increment card counts
    await supabaseAdmin.from('profiles').update({
      cards_used_this_month: cardsUsed + 1,
      cards_used_lifetime: profile.cards_used_lifetime + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', auth.user.id);

    return jsonResponse(201, {
      card: {
        id: card.id,
        themeId: card.theme_id,
        title: card.title,
        message: card.message,
        senderName: card.sender_name,
        recipientName: card.recipient_name,
        recipientEmail: card.recipient_email,
        status: card.status,
        shareToken: card.share_token,
        createdAt: card.created_at,
      },
    });
  } catch (err) {
    console.error('Create card error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
