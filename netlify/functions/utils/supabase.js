const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'voices-you-keep-jwt-secret-change-me';

// Public client (for auth operations that respect RLS)
function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Admin client (bypasses RLS for server-side operations)
function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Standard CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

// Handle OPTIONS preflight
function handleOptions() {
  return {
    statusCode: 204,
    headers: corsHeaders,
    body: '',
  };
}

// JSON response helper
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

// Sign JWT for a user
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT and return user payload
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Extract Bearer token from Authorization header
function extractToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

// Auth middleware — returns user payload or error response
function authenticateRequest(event) {
  const token = extractToken(event);
  if (!token) {
    return { error: jsonResponse(401, { error: 'Missing authentication token' }) };
  }
  const user = verifyToken(token);
  if (!user) {
    return { error: jsonResponse(401, { error: 'Invalid or expired token' }) };
  }
  return { user };
}

// Parse JSON body safely
function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
}

module.exports = {
  getSupabaseClient,
  getSupabaseAdmin,
  corsHeaders,
  handleOptions,
  jsonResponse,
  signToken,
  verifyToken,
  extractToken,
  authenticateRequest,
  parseBody,
};
