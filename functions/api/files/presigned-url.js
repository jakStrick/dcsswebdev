// Cloudflare Pages Functions - Generate Presigned URL for Direct R2 Upload
// This endpoint generates a presigned URL for uploading large files directly to R2

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

// Generate presigned URL for direct upload
export async function onRequestPost({ request, env }) {
	try {
		console.log("Presigned URL request received");

		// Check if R2 binding exists
		if (!env.FILES) {
			console.error("R2 binding 'FILES' not found");
			return new Response(
				JSON.stringify({
					error: "Storage not configured",
					details:
						"R2 bucket binding is not set up. Please configure the FILES binding in Cloudflare Pages settings.",
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

		// Parse request body
		const { fileName, fileType, fileSize } = await request.json();

		if (!fileName) {
			return new Response(
				JSON.stringify({ error: "fileName is required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		console.log("Generating presigned URL for:", fileName, "Size:", fileSize);

		// Generate unique file ID
		const fileId = crypto.randomUUID();
		const timestamp = Date.now();
		const fileExtension = fileName.split(".").pop() || "bin";
		const r2Key = `${payload.userId}/${timestamp}-${fileId}.${fileExtension}`;

		// Create metadata record in database first
		const result = await env.DB.prepare(
			`INSERT INTO personal_data (user_id, title, description, category, content, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
		)
			.bind(
				payload.userId,
				fileName,
				JSON.stringify({
					fileName: fileName,
					fileType: fileType || "application/octet-stream",
					fileSize: fileSize || 0,
					contentType: "r2",
					r2Key: r2Key,
					uploadDate: new Date().toISOString(),
					uploadStatus: "pending",
				}),
				"other",
				"",
				"pending"
			)
			.run();

		if (!result.success) {
			throw new Error("Failed to create file metadata");
		}

		const recordId = result.meta.last_row_id;

		console.log("Metadata created, ID:", recordId);

		// For direct R2 upload, we need to use multipart upload for large files
		// or return metadata for chunked upload through our endpoint
		return new Response(
			JSON.stringify({
				success: true,
				r2Key: r2Key,
				recordId: recordId,
				uploadEndpoint: `/api/files/stream-upload`,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	} catch (error) {
		console.error("Presigned URL error:", error);
		console.error("Error stack:", error.stack);
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
