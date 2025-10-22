// Cloudflare Pages Functions - Large File Upload to R2
// This endpoint handles large file uploads (up to 5GB) using R2 storage

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

// Upload file to R2
export async function onRequestPost({ request, env }) {
	try {
		console.log("Upload request received");

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

		// Parse multipart form data
		const formData = await request.formData();
		const file = formData.get("file");
		const title = formData.get("title");
		const category = formData.get("category") || "other";
		const description = formData.get("description") || "";

		if (!file) {
			return new Response(JSON.stringify({ error: "No file provided" }), {
				status: 400,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		console.log(
			"File received:",
			file.name,
			"Size:",
			file.size,
			"Type:",
			file.type
		);

		// Generate unique file ID
		const fileId = crypto.randomUUID();
		const timestamp = Date.now();
		const fileExtension = file.name.split(".").pop() || "bin";
		const r2Key = `${payload.userId}/${timestamp}-${fileId}.${fileExtension}`;

		console.log("Uploading to R2 with key:", r2Key);

		// Upload file to R2
		await env.FILES.put(r2Key, file.stream(), {
			httpMetadata: {
				contentType: file.type || "application/octet-stream",
			},
			customMetadata: {
				userId: payload.userId.toString(),
				originalFileName: file.name,
				uploadDate: new Date().toISOString(),
			},
		});

		console.log("File uploaded to R2 successfully");

		// Store metadata in D1 database
		const result = await env.DB.prepare(
			`INSERT INTO personal_data (user_id, title, description, category, content, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
		)
			.bind(
				payload.userId,
				title || file.name,
				JSON.stringify({
					fileName: file.name,
					fileType: file.type || "application/octet-stream",
					fileSize: file.size,
					contentType: "r2",
					r2Key: r2Key,
					uploadDate: new Date().toISOString(),
				}),
				category,
				description,
				"active"
			)
			.run();

		if (!result.success) {
			console.error("Database insert failed");
			// If DB insert fails, delete the R2 object
			await env.FILES.delete(r2Key);
			throw new Error("Failed to save file metadata");
		}

		console.log("Metadata saved to database, ID:", result.meta.last_row_id);

		return new Response(
			JSON.stringify({
				success: true,
				message: "File uploaded successfully",
				id: result.meta.last_row_id,
				fileSize: file.size,
				fileName: file.name,
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	} catch (error) {
		console.error("Upload error:", error);
		console.error("Error stack:", error.stack);
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
				stack: error.stack,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json", ...corsHeaders },
			}
		);
	}
}
