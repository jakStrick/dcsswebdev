// Cloudflare Pages Functions - Direct R2 Upload Handler
// This endpoint receives the file stream and uploads directly to R2

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, X-R2-Key, X-Record-Id",
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

// Direct upload to R2
export async function onRequestPut({ request, env }) {
	try {
		console.log("Direct upload request received");

		// Check if R2 binding exists
		if (!env.FILES) {
			console.error("R2 binding 'FILES' not found");
			return new Response(
				JSON.stringify({
					error: "Storage not configured",
					details: "R2 bucket binding is not set up.",
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

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

		console.log("User authenticated:", payload.userId);

		// Get R2 key and record ID from headers
		const r2Key = request.headers.get("X-R2-Key");
		const recordId = request.headers.get("X-Record-Id");

		if (!r2Key || !recordId) {
			return new Response(
				JSON.stringify({ error: "Missing R2 key or record ID" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		console.log("Uploading to R2 key:", r2Key);

		// Upload file stream directly to R2
		await env.FILES.put(r2Key, request.body, {
			httpMetadata: {
				contentType:
					request.headers.get("Content-Type") ||
					"application/octet-stream",
			},
		});

		console.log("File uploaded successfully to R2");

		// Update metadata record to mark as complete
		const updateResult = await env.DB.prepare(
			`UPDATE personal_data 
       SET status = 'active',
           description = json_set(description, '$.uploadStatus', 'complete'),
           updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
		)
			.bind(recordId, payload.userId)
			.run();

		if (!updateResult.success) {
			console.error("Failed to update metadata");
		}

		console.log("Metadata updated");

		return new Response(
			JSON.stringify({
				success: true,
				id: recordId,
				r2Key: r2Key,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	} catch (error) {
		console.error("Direct upload error:", error);
		console.error("Error stack:", error.stack);
		return new Response(
			JSON.stringify({
				error: "Upload failed",
				details: error.message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	}
}
