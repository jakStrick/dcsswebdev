// Cloudflare Pages Functions - Delete Personal Data Item
// This endpoint deletes a specific personal data item

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

// Delete personal data item endpoint
export async function onRequestDelete({ request, env, params }) {
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

		const itemId = params.id;

		if (!itemId) {
			return new Response(JSON.stringify({ error: "Item ID is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		// Check if item exists and belongs to user
		const item = await env.DB.prepare(
			"SELECT * FROM personal_data WHERE id = ? AND user_id = ?"
		)
			.bind(itemId, payload.userId)
			.first();

		if (!item) {
			return new Response(
				JSON.stringify({ error: "Item not found or access denied" }),
				{
					status: 404,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		// Delete the item
		const result = await env.DB.prepare(
			"DELETE FROM personal_data WHERE id = ? AND user_id = ?"
		)
			.bind(itemId, payload.userId)
			.run();

		if (!result.success) {
			throw new Error("Failed to delete item");
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: "Item deleted successfully",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	} catch (error) {
		console.error("Delete error:", error);
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
