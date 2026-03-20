const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

const providers = [
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.1-8b-instant'
  },
  {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_API_KEY,
    model: 'openai/gpt-3.5-turbo' // Standard safe fallback on OpenRouter or meta-llama/llama-3-8b-instruct
  },
  {
    name: 'DeepSeek',
    url: 'https://api.deepseek.com/chat/completions',
    key: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-chat'
  }
];

app.post('/generate', async (req, res) => {
  const { topic, vibe } = req.body;

  if (!vibe) {
    return res.status(400).json({ success: false, error: 'Vibe is required' });
  }

  const prompt = `You are an advanced AI Hinglish Caption Generator.

Your job is to:
1. Detect mood automatically from user input
2. Adjust tone based on selected vibe or personality
3. Generate viral, relatable captions for social media

INPUT:
User Text: ${topic || 'General life / Random'}
Vibe (optional): ${vibe}
Personality (optional): 

TASKS:
- Match captions with vibe/personality
- Generate content for Instagram/WhatsApp style

OUTPUT FORMAT STRICTLY AS FOLLOWS (NO EXTRA TEXT):

1. Mood Detected: (one word)

2. 5 Viral Hooks:
- [Hook 1]
- [Hook 2]
- [Hook 3]
- [Hook 4]
- [Hook 5]

3. 5 Captions (Hinglish + Emojis):
- [Caption 1]
- [Caption 2]
- [Caption 3]
- [Caption 4]
- [Caption 5]

4. Remix Options:
- Short Version: 
- Savage Version: 
- Funny Version: 
- Emoji Heavy Version: 

5. Hashtags:
#...

6. Viral Score:
Score: (0-100)
Reason: (one line)

RULES:
- Keep captions short (max 12 words)
- Use Hinglish (mix Hindi + English)
- Make it relatable and trendy
- Add emojis where needed
- Avoid repetition
- Make it sound like real Instagram posts
- Generate captions that feel human-written, not AI-generated.`;

  let lastError = null;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    if (!provider.key) {
      console.log(`Skipping ${provider.name} due to missing API key.`);
      continue;
    }

    try {
      console.log(`Trying provider: ${provider.name}`);
      
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.key}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Provider HTTP Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`Invalid response structure from ${provider.name}`);
      }

      const captions = data.choices[0].message.content;

      // Successful response
      return res.json({ 
        success: true, 
        provider: provider.name, 
        data: captions 
      });

    } catch (error) {
      console.error(`Error with ${provider.name}:`, error.message);
      lastError = error.message;
      // Continue to next provider inside the loop
    }
  }

  // If all providers failed
  return res.status(500).json({ 
    success: false, 
    error: 'All API providers failed to generate captions. Please try again later.',
    details: lastError
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
