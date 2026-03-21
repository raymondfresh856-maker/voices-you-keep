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

    // Extract card ID from path: /api/cards/:id/audio
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

    // For Netlify Functions, multipart form data handling is limited.
    // The audio data comes as base64-encoded body from the frontend.
    // We'll handle both multipart and base64 JSON approaches.
    let audioBuffer;
    let fileName = `${cardId}-${Date.now()}.webm`;
    let mimeType = 'audio/webm';
    let duration = 0;

    const contentType = event.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      // JSON body with base64 audio
      const body = JSON.parse(event.body || '{}');
      if (!body.audio) {
        return jsonResponse(400, { error: 'Audio data is required' });
      }
      audioBuffer = Buffer.from(body.audio, 'base64');
      mimeType = body.mimeType || 'audio/webm';
      duration = body.duration || 0;
      fileName = body.fileName || fileName;
    } else if (event.isBase64Encoded) {
      // Raw binary upload
      audioBuffer = Buffer.from(event.body, 'base64');
    } else {
      // Try parsing as multipart — Netlify auto-parses some
      audioBuffer = Buffer.from(event.body || '', 'utf-8');
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return jsonResponse(400, { error: 'No audio data received' });
    }

    // Max 50MB
    if (audioBuffer.length > 50 * 1024 * 1024) {
      return jsonResponse(413, { error: 'Audio file too large. Maximum size is 50MB.' });
    }

    // Upload to Supabase Storage
    const storagePath = `${auth.user.id}/${fileName}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('card-audio')
      .upload(storagePath, audioBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return jsonResponse(500, { error: 'Failed to upload audio' });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('card-audio')
      .getPublicUrl(storagePath);

    // Save audio metadata
    await supabaseAdmin.from('audio_files').insert({
      card_id: cardId,
      user_id: auth.user.id,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      file_size: audioBuffer.length,
      duration_seconds: duration,
    });

    // Update card with audio URL
    await supabaseAdmin.from('cards').update({
      audio_url: urlData.publicUrl,
      audio_duration: duration,
      updated_at: new Date().toISOString(),
    }).eq('id', cardId);

    return jsonResponse(200, {
      audioUrl: urlData.publicUrl,
      storagePath,
    });
  } catch (err) {
    console.error('Audio upload error:', err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};
