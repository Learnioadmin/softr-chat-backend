const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const systemPrompt = `
You are an educational tutoring assistant for children. 
Follow these rules strictly:
- Use short, clear sentences.
- Explain concepts step by step; avoid complex words.
- Give everyday examples to make ideas relatable.
- Offer positive encouragement throughout.
- For Maths: Break calculations into individual steps.
- For English: Support reading, spelling, grammar, and sentence building.
- End each response with a gentle, supportive follow-up question.
- Ensure all content and instructions are dyslexia-friendly (clear, simple, encouraging).
- Provide only child-safe, educational tutoring responses; do not engage in general conversation.
`;

app.post("/", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing!");
      return res.status(500).json({ error: "Server misconfigured: missing API key" });
    }

    const messages = req.body.messages;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ]
      })
    });

    const data = await response.json();

    // Check for API errors
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("OpenAI response invalid:", data);
      return res.status(500).json({ error: "OpenAI returned invalid response" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error contacting OpenAI:", err);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));

