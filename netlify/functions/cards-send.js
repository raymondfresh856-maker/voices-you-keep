const { getSupabaseAdmin, handleOptions, jsonResponse, authenticateRequest } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const auth = authenticateRequest(event);
  if (auth.error) return auth.error;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Extract card ID from path
    const pathParts = event.path.split('/');
    const cardIdIndex = pathParts.findIndex(p => p === 'cards') + 1;
    const cardId = pathParts[cardIdIndex];

    if (!cardId) {
      return jsonResponse(400, { error: 'Card ID is required' });
    }

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', auth.user.id)
      .single();

    if (cardError || !card) {
      return jsonResponse(404, { error: 'Card not found' });
    }

    if (card.status === 'sent' || card.status === 'delivered') {
      return jsonResponse(400, { error: 'Card has already been sent' });
    }

    // Update card status to sent — cards schema has no updated_at column
    const { error: updateError } = await supabaseAdmin
      .from('cards')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', cardId);

    if (updateError) {
      console.error('Send card error:', updateError);
      return jsonResponse(500, { error: 'Failed to send card' });
    }

    // Build share URL — share_url column stores the path (/open/{id})
    const baseUrl = event.headers.origin || event.headers.referer?.replace(/\/$/, '') || 'https://voices-you-keep.netlify.app';
    const sharePath = card.share_url || `/open/${card.id}`;
    const shareUrl = `${baseUrl}${sharePath}`;

    return jsonResponse(200, {
      message: 'Card sent successfully',
      shareUrl,
      shareToken: card.id,
    });
  } catch (err) {
    console.error('Send card error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
