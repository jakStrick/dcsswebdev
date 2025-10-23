// Cloudflare Pages Functions - Resend 2FA Code

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Generate random 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash code for storage
async function hashCode(code) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Send SMS via Twilio
async function sendSMS(phoneNumber, code, env) {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials not configured");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);

  const body = new URLSearchParams({
    To: phoneNumber,
    From: fromNumber,
    Body: `Your DCSS Web Dev verification code is: ${code}\n\nThis code expires in 5 minutes.`,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to send SMS");
  }

  return await response.json();
}

// Resend 2FA code endpoint (same as send-2fa but with different rate limits)
export async function onRequestPost({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, phoneNumber } = await request.json();

    if (!userId || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: "User ID and phone number required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check rate limiting - max 5 SMS per 10 minutes for resends
    const recentCodes = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM verification_codes 
       WHERE user_id = ? AND created_at > datetime('now', '-10 minutes')`
    )
      .bind(userId)
      .first();

    if (recentCodes.count >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait 10 minutes." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Invalidate old codes
    await env.DB.prepare(
      `UPDATE verification_codes SET verified = -1 
       WHERE user_id = ? AND verified = 0`
    )
      .bind(userId)
      .run();

    // Generate new code
    const code = generateCode();
    const codeHash = await hashCode(code);

    // Calculate expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store code in database
    const result = await env.DB.prepare(
      `INSERT INTO verification_codes 
       (user_id, code_hash, phone_number, expires_at, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`
    )
      .bind(userId, codeHash, phoneNumber, expiresAt)
      .run();

    if (!result.success) {
      throw new Error("Failed to store verification code");
    }

    // Send SMS
    await sendSMS(phoneNumber, code, env);

    // Log activity
    await env.DB.prepare(
      `INSERT INTO activity_log (user_id, action, details) 
       VALUES (?, '2FA_CODE_RESENT', ?)`
    )
      .bind(userId, `Code resent to ${phoneNumber}`)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification code resent successfully",
        expiresAt: expiresAt,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Resend 2FA error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
