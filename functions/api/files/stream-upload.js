// Cloudflare Pages Functions - Chunked Stream Upload to R2
// This endpoint receives file chunks and streams them to R2

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, X-R2-Key, X-Record-Id, X-Chunk-Index, X-Total-Chunks, Content-Range",
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

// Chunked upload to R2
export async function onRequestPost({ request, env }) {
	try {
		console.log("Stream upload request received");

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

		// Get metadata from headers
		const r2Key = request.headers.get("X-R2-Key");
		const recordId = request.headers.get("X-Record-Id");
		const chunkIndex = parseInt(request.headers.get("X-Chunk-Index") || "0");
		const totalChunks = parseInt(
			request.headers.get("X-Total-Chunks") || "1"
		);

		if (!r2Key || !recordId) {
			return new Response(
				JSON.stringify({ error: "Missing R2 key or record ID" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}

		console.log(
			`Processing chunk ${
				chunkIndex + 1
			}/${totalChunks} for R2 key: ${r2Key}`
		);

		// For single chunk (file < 100MB) or last chunk, upload directly
		if (totalChunks === 1 || chunkIndex === totalChunks - 1) {
			// Upload the chunk directly to R2
			const contentType =
				request.headers.get("Content-Type") || "application/octet-stream";

			// If this is a single chunk, upload the whole file
			if (totalChunks === 1) {
				await env.FILES.put(r2Key, request.body, {
					httpMetadata: {
						contentType: contentType,
					},
				});
				console.log("Single chunk uploaded successfully");
			} else {
				// Multi-chunk upload - append to existing file
				// Note: R2 doesn't support append, so we need to use KV or Durable Objects to buffer chunks
				// For now, let's use multipart upload
				const multipartKey = `${r2Key}-multipart-${recordId}`;

				// Store chunk in temporary location
				const chunkKey = `${multipartKey}-chunk-${chunkIndex}`;
				await env.FILES.put(chunkKey, request.body);

				console.log(`Chunk ${chunkIndex} stored temporarily`);

				// If this is the last chunk, combine all chunks
				if (chunkIndex === totalChunks - 1) {
					console.log("Last chunk received, combining all chunks...");

					// Read all chunks and combine them
					const chunks = [];
					for (let i = 0; i < totalChunks; i++) {
						const chunkKey = `${multipartKey}-chunk-${i}`;
						const chunk = await env.FILES.get(chunkKey);
						if (chunk) {
							chunks.push(await chunk.arrayBuffer());
						}
					}

					// Combine all chunks into single file
					const combinedBlob = new Blob(chunks);
					await env.FILES.put(r2Key, combinedBlob, {
						httpMetadata: {
							contentType: contentType,
						},
					});

					console.log("All chunks combined and uploaded to R2");

					// Clean up temporary chunks
					for (let i = 0; i < totalChunks; i++) {
						const chunkKey = `${multipartKey}-chunk-${i}`;
						await env.FILES.delete(chunkKey);
					}

					console.log("Temporary chunks cleaned up");
				}
			}

			// Update metadata record to mark as complete (only on last chunk)
			if (chunkIndex === totalChunks - 1) {
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

				console.log("Metadata updated to active");
			}

			return new Response(
				JSON.stringify({
					success: true,
					id: recordId,
					r2Key: r2Key,
					chunkIndex: chunkIndex,
					complete: chunkIndex === totalChunks - 1,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		} else {
			// Store intermediate chunk
			const multipartKey = `${r2Key}-multipart-${recordId}`;
			const chunkKey = `${multipartKey}-chunk-${chunkIndex}`;
			await env.FILES.put(chunkKey, request.body);

			console.log(`Chunk ${chunkIndex} stored`);

			return new Response(
				JSON.stringify({
					success: true,
					chunkIndex: chunkIndex,
					complete: false,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json", ...corsHeaders },
				}
			);
		}
	} catch (error) {
		console.error("Stream upload error:", error);
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
