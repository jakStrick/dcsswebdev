import { post } from "axios";

async function getAIResponse(prompt) {
  const response = await post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer YOUR_API_KEY`,
      },
    }
  );

  return response.data.choices[0].message.content;
}
