const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cloudflare AI API proxy endpoint
app.post("/api/chat", async (req, res) => {
	try {
		const { messages, ...otherParams } = req.body;

		// Validate required data
		if (!messages || !Array.isArray(messages)) {
			return res.status(400).json({
				error: "Messages array is required",
			});
		}

		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages,
					...otherParams, // Allow other parameters like temperature, max_tokens, etc.
				}),
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Cloudflare API Error:", response.status, errorText);
			return res.status(response.status).json({
				error: "Cloudflare API request failed",
				details: errorText,
			});
		}

		const data = await response.json();
		res.json(data);
	} catch (error) {
		console.error("Proxy error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error.message,
		});
	}
});

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
	console.log(`Proxy server running on port ${PORT}`);
	console.log(`Health check: http://localhost:${PORT}/health`);
	console.log(`Chat endpoint: http://localhost:${PORT}/api/chat`);
});

module.exports = app;
