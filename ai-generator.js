// ===================================
// AI Content Generator - Multi-Provider (Groq + Gemini)
// ===================================

class AIGenerator {
    constructor(profileManager) {
        this.profileManager = profileManager;
        this.apiKey = this.loadApiKey();
        this.groqApiKey = this.loadGroqApiKey();
        this.manualMode = this.loadManualMode();
        this.provider = this.loadProvider(); // 'groq' or 'gemini'
    }

    // ===================================
    // Configuration Management
    // ===================================

    loadApiKey() {
        return (localStorage.getItem('gemini_api_key') || '').trim();
    }

    saveApiKey(key) {
        this.apiKey = key.trim();
        localStorage.setItem('gemini_api_key', this.apiKey);
    }

    loadGroqApiKey() {
        return (localStorage.getItem('groq_api_key') || '').trim();
    }

    saveGroqApiKey(key) {
        this.groqApiKey = key.trim();
        localStorage.setItem('groq_api_key', this.groqApiKey);
    }

    loadProvider() {
        return localStorage.getItem('ai_provider') || 'groq'; // Default to Groq
    }

    setProvider(provider) {
        this.provider = provider;
        localStorage.setItem('ai_provider', provider);
    }

    hasApiKey() {
        // In production (Netlify), API key is on the server
        const isProduction = window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1' &&
            window.location.protocol !== 'file:';

        if (isProduction) {
            return true; // Key is configured on server
        }

        // Local development - check localStorage
        if (this.provider === 'groq') {
            return this.groqApiKey.length > 0;
        }
        return this.apiKey.length > 0;
    }

    getCurrentApiKey() {
        return this.provider === 'groq' ? this.groqApiKey : this.apiKey;
    }

    loadManualMode() {
        return localStorage.getItem('manual_mode') === 'true';
    }

    setManualMode(active) {
        this.manualMode = active;
        localStorage.setItem('manual_mode', active);
    }

    // ===================================
    // Content Type Configuration
    // ===================================

    getContentTypeConfig(type) {
        const configs = {
            instagram: { name: 'Instagram', maxLength: 2200, tips: ['Use emojis', 'Hashtags'], system: 'Especialista em marketing de Instagram.' },
            facebook: { name: 'Facebook', maxLength: 5000, tips: ['Conte histórias'], system: 'Especialista em Facebook.' },
            twitter: { name: 'Twitter/X', maxLength: 280, tips: ['Direto e rápido'], system: 'Especialista em Twitter.' },
            tiktok: { name: 'TikTok', maxLength: 2200, tips: ['Criativo'], system: 'Especialista em TikTok.' },
            email: { name: 'Email', maxLength: 10000, tips: ['Personalize'], system: 'Especialista em Email Marketing.' },
            press: { name: 'Press Release', maxLength: 15000, tips: ['Profissional'], system: 'Especialista em Press Releases.' }
        };
        return configs[type] || configs.instagram;
    }

    // ===================================
    // Content Generation
    // ===================================

    async generateContent(contentType, topic, details = '', tone = 'casual') {
        if (this.manualMode) return this.getManualTemplate(contentType, topic, details, tone);
        if (!this.hasApiKey()) throw new Error('API Key não configurada.');

        if (this.provider === 'groq') {
            return this.generateWithGroq(contentType, topic, details, tone);
        } else {
            return this.generateWithGemini(contentType, topic, details, tone);
        }
    }

    // ===================================
    // GROQ API Integration
    // ===================================

    async generateWithGroq(contentType, topic, details, tone) {
        const config = this.getContentTypeConfig(contentType);
        const profile = this.profileManager.getFormattedContext();
        const artistName = this.profileManager.profile?.bio?.name || 'o artista';
        const artistGenre = this.profileManager.profile?.bio?.genre || 'música';

        // Get knowledge base context if available
        let knowledgeContext = '';
        if (typeof knowledgeBase !== 'undefined' && knowledgeBase) {
            knowledgeContext = knowledgeBase.getContextForAI(2000);
        }

        const systemPrompt = `Você é uma assistente de marketing musical especializada em ajudar artistas. 
Contexto sobre ${artistName} (${artistGenre}):
${profile.substring(0, 1500)}
${knowledgeContext}

Você é ${config.system} Sempre responda em Português do Brasil.
Use as estratégias e briefings da base de conhecimento para criar conteúdo alinhado com a comunicação do artista.`;

        const userPrompt = `Crie um post para ${config.name} sobre: "${topic}"
${details ? `Detalhes adicionais: ${details}` : ''}
Tom desejado: ${tone}

IMPORTANTE: Gere APENAS o texto do post, sem introduções, explicações ou comentários. O texto deve estar pronto para publicar.`;

        try {
            // Use secure backend proxy
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    provider: 'groq',
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Erro na API do Groq');
            }

            if (data.choices?.[0]?.message?.content) {
                return this.formatGeneratedContent(data.choices[0].message.content, contentType);
            }

            throw new Error('Resposta vazia do Groq');
        } catch (error) {
            console.error('Groq API Error:', error);
            throw error;
        }
    }

    // ===================================
    // GEMINI API Integration (Backup)
    // ===================================

    async generateWithGemini(contentType, topic, details, tone) {
        const config = this.getContentTypeConfig(contentType);
        const profile = this.profileManager.getFormattedContext();
        const artistName = this.profileManager.profile?.bio?.name || 'o artista';

        const systemPrompt = `Aja como ${artistName}. Contexto: ${profile.substring(0, 1000)}. Especialista em ${config.name}.`;
        const userPrompt = `Crie um post sobre "${topic}". Detalhes: ${details}. Tom: ${tone}. Gere APENAS o texto em Português sem introduções.`;

        try {
            // Use secure backend proxy
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    provider: 'gemini',
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Erro na API do Gemini');
            }

            if (data.choices?.[0]?.message?.content) {
                return this.formatGeneratedContent(data.choices[0].message.content, contentType);
            }

            throw new Error('Resposta vazia do Gemini');
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    // ===================================
    // Connection Test
    // ===================================

    async testConnection() {
        if (!this.hasApiKey()) throw new Error('API Key não configurada.');

        if (this.provider === 'groq') {
            return this.testGroqConnection();
        } else {
            return this.testGeminiConnection();
        }
    }

    async testGroqConnection() {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.groqApiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: 'Diga apenas: OK' }],
                    max_tokens: 10
                })
            });

            const data = await response.json();

            if (response.ok && data.choices?.[0]?.message?.content) {
                return { success: true, provider: 'Groq', model: 'llama-3.3-70b-versatile' };
            }

            return { success: false, error: data.error?.message || 'Falha na conexão com Groq' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async testGeminiConnection() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Oi" }] }] })
            });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return { success: true, provider: 'Gemini', model: 'gemini-2.0-flash' };
            }

            const rawMsg = (data.error?.message || JSON.stringify(data) || "").toLowerCase();
            if (rawMsg.includes("must contain") || rawMsg.includes("empty") || rawMsg.includes("quota")) {
                return { success: false, error: "GOOGLE_ACCOUNT_ERROR" };
            }
            return { success: false, error: data.error?.message || "Falha na conexão" };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ===================================
    // Utility Functions
    // ===================================

    getManualTemplate(contentType, topic, details, tone) {
        return `[RASCUNHO ${contentType.toUpperCase()}]\nTema: ${topic}\n\n[Escreva aqui seu post...]`;
    }

    formatGeneratedContent(text, contentType) {
        let f = text.trim().replace(/\*\*/g, '').replace(/\*/g, '');
        if (contentType === 'twitter' && f.length > 280) f = f.substring(0, 277) + '...';
        return f;
    }

    getContentMetadata(content, contentType) {
        return {
            characters: content.length,
            words: content.split(/\s+/).length,
            hashtags: (content.match(/#\w+/g) || []).length,
            emojis: (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
            maxLength: this.getContentTypeConfig(contentType).maxLength,
            withinLimit: content.length <= (contentType === 'twitter' ? 280 : 10000)
        };
    }

    formatMetadataDisplay(m, type) {
        return `<span>${m.characters} chars</span> • <span>${m.words} words</span>`;
    }

    getTipsForContentType(type) { return this.getContentTypeConfig(type).tips; }
    saveDiscoveredModels(m) { } // Compatibilidade
}

if (typeof module !== 'undefined' && module.exports) module.exports = AIGenerator;
