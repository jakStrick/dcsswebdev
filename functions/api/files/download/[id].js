// Cloudflare Pages Functions - Download File from R2
// This endpoint retrieves files from R2 storage

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

// Handle CORS preflight
export async function onRequestOptions() {
	return new Response(null, { headers: corsHeaders });
}

// Download file from R2
export async function onRequestGet({ request, env, params }) {
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

		const itemId = params.id;

		// Get file metadata from database
		const item = await env.DB.prepare(
			"SELECT * FROM personal_data WHERE id = ? AND user_id = ?"
		)
			.bind(itemId, payload.userId)
			.first();

		if (!item) {
			return new Response(
				JSON.stringify({ error: "File not found or access denied" }),
				{
					status: 404,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		// Parse metadata
		let metadata;
		try {
			metadata = JSON.parse(item.description);
		} catch (e) {
			return new Response(
				JSON.stringify({ error: "Invalid file metadata" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		// Check if file is stored in R2
		if (metadata.contentType !== "r2") {
			return new Response(
				JSON.stringify({ error: "This file is not stored in R2" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		// Get file from R2
		const object = await env.FILES.get(metadata.r2Key);

		if (!object) {
			return new Response(
				JSON.stringify({ error: "File not found in storage" }),
				{
					status: 404,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		// Return file
		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set(
			"Content-Disposition",
			`attachment; filename="${metadata.fileName}"`
		);
		headers.set("Access-Control-Allow-Origin", "*");

		return new Response(object.body, {
			headers,
		});
	} catch (error) {
		console.error("Download error:", error);
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
