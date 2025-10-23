// Cloudflare Pages Functions - Registration Worker

// Helper to hash password using Web Crypto API (Cloudflare compatible)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hash;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Registration endpoint
export async function onRequestPost({ request, env }) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, password, phoneNumber, twoFactorEnabled } =
      await request.json();

    // Validate input
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Name, email, and password are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          error: "Password must be at least 8 characters long",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate 2FA requirements
    if (twoFactorEnabled && !phoneNumber) {
      return new Response(
        JSON.stringify({
          error: "Phone number required for two-factor authentication",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user already exists
    const existingUser = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new user with phone number and 2FA settings
    const result = await env.DB.prepare(
      `INSERT INTO users 
       (name, email, password_hash, phone_number, phone_verified, two_factor_enabled, created_at, last_login) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(
        name,
        email,
        passwordHash,
        phoneNumber || null,
        phoneNumber ? 1 : 0, // Auto-verify phone if provided during registration
        twoFactorEnabled ? 1 : 0
      )
      .run();

    if (!result.success) {
      throw new Error("Failed to create user");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration successful",
        user: {
          name,
          email,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
