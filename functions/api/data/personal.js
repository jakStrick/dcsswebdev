// Cloudflare Pages Functions - Personal Data API
// This endpoint retrieves personal data from D1 database

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function verifyToken(token) {
	try {
		const [headerB64, payloadB64, signatureB64] = token.split(".");
		const payload = JSON.parse(atob(payloadB64));

		if (payload.exp && payload.exp < Date.now() / 1000) {
			return null;
		}

		return payload;
	} catch (error) {
		return null;
	}
}

// Get personal data endpoint
export async function onRequestGet({ request, env }) {
	// Handle CORS preflight
	if (request.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders });
	}

	try {
		// Verify authentication
		const authHeader = request.headers.get("Authorization");

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		const token = authHeader.substring(7);
		const payload = await verifyToken(token);

		if (!payload) {
			return new Response(
				JSON.stringify({ error: "Invalid or expired token" }),
				{
					status: 401,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		// Get user info
		const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
			.bind(payload.userId)
			.first();

		if (!user) {
			return new Response(JSON.stringify({ error: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		// Get personal data records for this user
		const records = await env.DB.prepare(
			`SELECT * FROM personal_data 
       WHERE user_id = ? 
       ORDER BY created_at DESC`
		)
			.bind(payload.userId)
			.all();

		// Get statistics
		const stats = await env.DB.prepare(
			`SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        MAX(updated_at) as last_updated
       FROM personal_data 
       WHERE user_id = ?`
		)
			.bind(payload.userId)
			.first();

		return new Response(
			JSON.stringify({
				success: true,
				totalRecords: stats?.total || 0,
				activeItems: stats?.active || 0,
				lastUpdated: stats?.last_updated || null,
				lastLogin: user.last_login,
				records: records.results || [],
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	} catch (error) {
		console.error("Data retrieval error:", error);
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	}
}

// Post personal data endpoint
export async function onRequestPost({ request, env }) {
	// Handle CORS preflight
	if (request.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders });
	}

	try {
		// Verify authentication
		const authHeader = request.headers.get("Authorization");

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		const token = authHeader.substring(7);
		const payload = await verifyToken(token);

		if (!payload) {
			return new Response(
				JSON.stringify({ error: "Invalid or expired token" }),
				{
					status: 401,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		// Get request body
		const { title, description, category, content, status } =
			await request.json();

		// Validate required fields
		if (!title) {
			return new Response(JSON.stringify({ error: "Title is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		// Insert new personal data record
		const result = await env.DB.prepare(
			`INSERT INTO personal_data (user_id, title, description, category, content, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
		)
			.bind(
				payload.userId,
				title,
				description || null,
				category || null,
				content || null,
				status || "active"
			)
			.run();

		if (!result.success) {
			throw new Error("Failed to save data");
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: "Data saved successfully",
				id: result.meta.last_row_id,
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	} catch (error) {
		console.error("Data save error:", error);
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	}
}
