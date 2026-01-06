// AI Chat Proxy - Secure backend for Groq and Gemini
// Keys are stored in Vercel environment variables

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages, provider = 'groq', temperature = 0.7, max_tokens = 2000 } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: 'Missing or invalid messages array'
            });
        }

        // Route to appropriate provider
        if (provider === 'gemini') {
            return await handleGemini(req, res, messages, temperature, max_tokens);
        } else {
            return await handleGroq(req, res, messages, temperature, max_tokens);
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Handle Groq (LLaMA) requests
async function handleGroq(req, res, messages, temperature, max_tokens) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        return res.status(500).json({
            error: 'GROQ_API_KEY not configured on server'
        });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature,
            max_tokens
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Groq API error:', errorData);
        return res.status(response.status).json({
            error: `Groq API error: ${response.status}`,
            details: errorData
        });
    }

    const data = await response.json();
    return res.status(200).json(data);
}

// Handle Gemini requests
async function handleGemini(req, res, messages, temperature, max_tokens) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({
            error: 'GEMINI_API_KEY not configured on server'
        });
    }

    // Convert OpenAI-style messages to Gemini format
    const geminiMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    // Extract system instruction if present
    let systemInstruction = null;
    const filteredMessages = geminiMessages.filter(msg => {
        if (msg.role === 'user' && messages.find(m => m.role === 'system' && m.content === msg.parts[0].text)) {
            systemInstruction = msg.parts[0].text;
            return false;
        }
        return true;
    });

    // Handle system messages
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg) {
        systemInstruction = systemMsg.content;
    }

    const requestBody = {
        contents: filteredMessages.filter(m => m.role !== 'system'),
        generationConfig: {
            temperature,
            maxOutputTokens: max_tokens
        }
    };

    if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        }
    );

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', errorData);
        return res.status(response.status).json({
            error: `Gemini API error: ${response.status}`,
            details: errorData
        });
    }

    const data = await response.json();

    // Convert Gemini response to OpenAI format for frontend compatibility
    const openAIFormat = {
        choices: [{
            message: {
                role: 'assistant',
                content: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            }
        }],
        model: 'gemini-2.0-flash',
        provider: 'gemini'
    };

    return res.status(200).json(openAIFormat);
}
