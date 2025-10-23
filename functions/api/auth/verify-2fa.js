// Cloudflare Pages Functions - Verify 2FA Code

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Hash code for comparison
async function hashCode(code) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate JWT token
async function generateToken(payload, env) {
  const header = { alg: "HS256", typ: "JWT" };
  const secret = env.JWT_SECRET || "YOUR_SECRET_KEY_CHANGE_THIS";

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

// Generate device fingerprint
function generateDeviceFingerprint(request) {
  const userAgent = request.headers.get("User-Agent") || "";
  const ip = request.headers.get("CF-Connecting-IP") || "";
  return btoa(`${userAgent}-${ip}`).substring(0, 64);
}

// Verify 2FA code endpoint
export async function onRequestPost({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, code, trustDevice } = await request.json();

    if (!userId || !code) {
      return new Response(
        JSON.stringify({ error: "User ID and code required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get the most recent unverified code for this user
    const storedCode = await env.DB.prepare(
      `SELECT * FROM verification_codes 
       WHERE user_id = ? AND verified = 0 
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(userId)
      .first();

    if (!storedCode) {
      return new Response(
        JSON.stringify({
          error: "No verification code found. Please request a new one.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(storedCode.expires_at);

    if (now > expiresAt) {
      await env.DB.prepare(
        "UPDATE verification_codes SET verified = -1 WHERE id = ?"
      )
        .bind(storedCode.id)
        .run();

      return new Response(
        JSON.stringify({
          error: "Code has expired. Please request a new one.",
        }),
        {
          status: 410,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check attempts limit
    if (storedCode.attempts >= 3) {
      await env.DB.prepare(
        "UPDATE verification_codes SET verified = -1 WHERE id = ?"
      )
        .bind(storedCode.id)
        .run();

      return new Response(
        JSON.stringify({
          error: "Too many failed attempts. Please request a new code.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify code
    const codeHash = await hashCode(code);

    if (codeHash !== storedCode.code_hash) {
      // Increment attempts
      await env.DB.prepare(
        "UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?"
      )
        .bind(storedCode.id)
        .run();

      const attemptsLeft = 3 - (storedCode.attempts + 1);
      return new Response(
        JSON.stringify({
          error: `Invalid code. ${attemptsLeft} ${
            attemptsLeft === 1 ? "attempt" : "attempts"
          } remaining.`,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Code is valid! Mark as verified
    await env.DB.prepare(
      "UPDATE verification_codes SET verified = 1 WHERE id = ?"
    )
      .bind(storedCode.id)
      .run();

    // Get user details
    const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
      .bind(userId)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update last login
    await env.DB.prepare(
      'UPDATE users SET last_login = datetime("now") WHERE id = ?'
    )
      .bind(userId)
      .run();

    // Handle trusted device
    if (trustDevice) {
      const deviceFingerprint = generateDeviceFingerprint(request);
      const trustedUntil = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(); // 30 days

      // Check if device already exists
      const existingDevice = await env.DB.prepare(
        "SELECT id FROM trusted_devices WHERE user_id = ? AND device_fingerprint = ?"
      )
        .bind(userId, deviceFingerprint)
        .first();

      if (existingDevice) {
        // Update existing
        await env.DB.prepare(
          `UPDATE trusted_devices 
           SET trusted_until = ?, last_used = datetime('now') 
           WHERE id = ?`
        )
          .bind(trustedUntil, existingDevice.id)
          .run();
      } else {
        // Insert new trusted device
        await env.DB.prepare(
          `INSERT INTO trusted_devices 
           (user_id, device_fingerprint, device_name, trusted_until, created_at) 
           VALUES (?, ?, ?, ?, datetime('now'))`
        )
          .bind(
            userId,
            deviceFingerprint,
            request.headers.get("User-Agent")?.substring(0, 100) ||
              "Unknown Device",
            trustedUntil
          )
          .run();
      }
    }

    // Generate JWT token
    const expiresIn = 24 * 60 * 60; // 24 hours
    const token = await generateToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      },
      env
    );

    // Log successful 2FA
    await env.DB.prepare(
      `INSERT INTO activity_log (user_id, action, details) 
       VALUES (?, '2FA_VERIFIED', 'Successfully verified 2FA code')`
    )
      .bind(userId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        token: token,
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
    console.error("Verify 2FA error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
