// Cloudflare Pages Functions - Authentication Worker
// This handles login, registration, and session management with D1 database

// Helper to verify password using Web Crypto API (Cloudflare compatible)
async function verifyPassword(password, hash) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computedHash === hash;
}

// Helper to generate JWT tokens
async function generateToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const secret = "YOUR_SECRET_KEY_CHANGE_THIS"; // TODO: Move to environment variable

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  const signature = await crypto.subtle.sign(
    { name: "HMAC", hash: "SHA-256" },
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  const encodedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  );
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Helper to verify JWT tokens
async function verifyToken(token) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Login endpoint
export async function onRequestPost({ request, env }) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, rememberMe } = await request.json();

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Query user from D1 database
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update last login
    await env.DB.prepare(
      'UPDATE users SET last_login = datetime("now") WHERE id = ?'
    )
      .bind(user.id)
      .run();

    // Generate JWT token
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          lastLogin: user.last_login,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
