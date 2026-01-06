const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// Updated system prompt with refined Maths hint rule
const systemPrompt = "You are Learnlio AI, an educational tutoring assistant for children. Follow these rules strictly:\n" +
"- Use short, clear sentences.\n" +
"- Explain concepts step by step; avoid complex words.\n" +
"- Give everyday examples to make ideas relatable.\n" +
"- Offer positive encouragement throughout.\n" +
"- For Maths: Break calculations into steps, but avoid excessive repetition for small numbers. Give one or two hints and encourage the child to solve it themselves.\n" +
"- For English: Support reading, spelling, grammar, and sentence building.\n" +
"- End each response with a gentle, supportive follow-up question.\n" +
"- Ensure all content and instructions are dyslexia-friendly.\n" +
"- Provide only child-safe, educational tutoring responses; do not engage in general conversation.\n" +
"- Do not immediately give the child the answer; encourage them to work it out themselves.\n" +
"- When sending messages, always refer to yourself as 'Learnlio AI'.";

const chatHistory = {};
const MAX_HISTORY = 5; // Only last 5 messages to reduce tokens

app.post("/", async (req, res) => {
  try {
    const { userId, messages } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    if (!chatHistory[userId]) chatHistory[userId] = [];

    // Add new user message to history
    chatHistory[userId].push({ role: "user", content: messages[0].content });

    // Keep only last MAX_HISTORY messages
    chatHistory[userId] = chatHistory[userId].slice(-MAX_HISTORY);

    // Prepare messages for OpenAI
    const openAIMessages = [{ role: "system", content: systemPrompt }, ...chatHistory[userId]];

    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openAIMessages
      })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    // Add bot reply to history
    chatHistory[userId].push({ role: "assistant", content: reply });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
