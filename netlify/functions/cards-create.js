const { getSupabaseAdmin, handleOptions, jsonResponse, authenticateRequest, parseBody } = require('./utils/supabase');

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

    // Get user profile — actual schema: id, email, display_name, tier
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse(404, { error: 'User profile not found' });
    }

    // Create card — actual schema: id, user_id, title, message, theme_id,
    // recipient_name, recipient_email, status, share_url, sent_at, created_at
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .insert({
        user_id: auth.user.id,
        theme_id: themeId,
        title: title || 'Voice Message Card',
        message: message || '',
        recipient_name: recipientName.trim(),
        recipient_email: recipientEmail ? recipientEmail.trim().toLowerCase() : null,
        status: 'draft',
      })
      .select()
      .single();

    if (cardError) {
      console.error('Card creation error:', cardError.message || JSON.stringify(cardError));
      return jsonResponse(500, { error: 'Failed to create card: ' + (cardError.message || JSON.stringify(cardError)) });
    }

    // Set the share URL using the card's own ID
    await supabaseAdmin
      .from('cards')
      .update({ share_url: `/open/${card.id}` })
      .eq('id', card.id);

    return jsonResponse(201, {
      card: {
        id: card.id,
        themeId: card.theme_id,
        title: card.title,
        message: card.message,
        senderName: senderName || profile.display_name || profile.email,
        recipientName: card.recipient_name,
        recipientEmail: card.recipient_email,
        status: card.status,
        shareToken: card.id,
        createdAt: card.created_at,
      },
    });
  } catch (err) {
    console.error('Create card error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
