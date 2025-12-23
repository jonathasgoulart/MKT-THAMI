// ===================================
// Chat Assistant - Advanced Marketing AI with Memory
// ===================================

class ChatAssistant {
    constructor(aiGenerator, knowledgeBase) {
        this.aiGenerator = aiGenerator;
        this.knowledgeBase = knowledgeBase;
        this.messages = this.loadMessages();
        this.memory = this.loadMemory();
        this.isTyping = false;
    }

    // ===================================
    // Message Storage (Session)
    // ===================================

    loadMessages() {
        try {
            return JSON.parse(sessionStorage.getItem('chat_messages')) || [];
        } catch {
            return [];
        }
    }

    saveMessages() {
        sessionStorage.setItem('chat_messages', JSON.stringify(this.messages));
    }

    clearMessages() {
        this.messages = [];
        this.saveMessages();
    }

    addMessage(role, content) {
        this.messages.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });
        this.saveMessages();

        // Auto-extract insights from user messages
        if (role === 'user') {
            this.extractInsights(content);
        }
    }

    // ===================================
    // Permanent Memory (localStorage)
    // ===================================

    loadMemory() {
        try {
            return JSON.parse(localStorage.getItem('chat_memory')) || {
                insights: [],
                preferences: {},
                learnedFacts: []
            };
        } catch {
            return { insights: [], preferences: {}, learnedFacts: [] };
        }
    }

    saveMemory() {
        localStorage.setItem('chat_memory', JSON.stringify(this.memory));
    }

    addInsight(category, content) {
        const insight = {
            id: Date.now().toString(),
            category,
            content,
            createdAt: new Date().toISOString()
        };

        // Avoid duplicates
        const isDuplicate = this.memory.insights.some(i =>
            i.content.toLowerCase() === content.toLowerCase()
        );

        if (!isDuplicate) {
            this.memory.insights.unshift(insight);
            // Keep max 50 insights
            if (this.memory.insights.length > 50) {
                this.memory.insights = this.memory.insights.slice(0, 50);
            }
            this.saveMemory();
            return true;
        }
        return false;
    }

    addLearnedFact(fact) {
        if (!this.memory.learnedFacts.includes(fact)) {
            this.memory.learnedFacts.unshift(fact);
            if (this.memory.learnedFacts.length > 30) {
                this.memory.learnedFacts = this.memory.learnedFacts.slice(0, 30);
            }
            this.saveMemory();
        }
    }

    setPreference(key, value) {
        this.memory.preferences[key] = value;
        this.saveMemory();
    }

    getMemoryContext() {
        let context = '';

        if (this.memory.learnedFacts.length > 0) {
            context += '\n\n# FATOS APRENDIDOS SOBRE A THAMI\n';
            context += this.memory.learnedFacts.slice(0, 15).map(f => `- ${f}`).join('\n');
        }

        if (this.memory.insights.length > 0) {
            context += '\n\n# INSIGHTS DE CONVERSAS ANTERIORES\n';
            const recentInsights = this.memory.insights.slice(0, 10);
            context += recentInsights.map(i => `- [${i.category}] ${i.content}`).join('\n');
        }

        if (Object.keys(this.memory.preferences).length > 0) {
            context += '\n\n# PREFERÊNCIAS DO USUÁRIO\n';
            for (const [key, value] of Object.entries(this.memory.preferences)) {
                context += `- ${key}: ${value}\n`;
            }
        }

        return context;
    }

    extractInsights(userMessage) {
        const msg = userMessage.toLowerCase();

        // Auto-detect important information patterns
        const patterns = [
            { regex: /show\s+(?:em|no|na)\s+([^,\.]+)/i, category: 'Evento', extract: 1 },
            { regex: /lançamento\s+(?:do|da|de)\s+([^,\.]+)/i, category: 'Lançamento', extract: 1 },
            { regex: /single\s+(?:chamado|chamada)?\s*"?([^"]+)"?/i, category: 'Música', extract: 1 },
            { regex: /álbum\s+(?:chamado|chamada)?\s*"?([^"]+)"?/i, category: 'Álbum', extract: 1 },
            { regex: /parceria\s+(?:com)\s+([^,\.]+)/i, category: 'Colaboração', extract: 1 },
            { regex: /(\d+)\s*(?:mil|k)\s*(?:seguidores|followers)/i, category: 'Métrica', extract: 0 },
        ];

        for (const pattern of patterns) {
            const match = userMessage.match(pattern.regex);
            if (match) {
                const content = pattern.extract === 0 ? match[0] : match[pattern.extract];
                if (content && content.length > 3) {
                    this.addInsight(pattern.category, content.trim());
                }
            }
        }
    }

    clearMemory() {
        this.memory = { insights: [], preferences: {}, learnedFacts: [] };
        this.saveMemory();
    }

    getMemoryStats() {
        return {
            insights: this.memory.insights.length,
            facts: this.memory.learnedFacts.length,
            preferences: Object.keys(this.memory.preferences).length
        };
    }

    // ===================================
    // Advanced System Prompt
    // ===================================

    getSystemPrompt() {
        const profile = this.aiGenerator.profileManager.getFormattedContext();
        let knowledgeContext = '';
        if (this.knowledgeBase) {
            knowledgeContext = this.knowledgeBase.getContextForAI(3000);
        }

        // Get selected platform from global variable
        const platform = typeof selectedPlatform !== 'undefined' ? selectedPlatform : 'instagram';
        const platformNames = {
            instagram: 'Instagram (Feed/Stories/Reels)',
            twitter: 'Twitter/X (máximo 280 caracteres)',
            facebook: 'Facebook',
            tiktok: 'TikTok (linguagem Gen-Z, trends)',
            youtube: 'YouTube (títulos, descrições, roteiros)',
            email: 'Email/Newsletter',
            press: 'Press Release (formal)',
            all: 'Multiplataforma (adapte para várias redes)'
        };

        return `# IDENTIDADE
Você é um ESTRATEGISTA DE MARKETING DIGITAL de elite, especializado na indústria musical brasileira. Você combina criatividade artística com análise estratégica baseada em dados. Seu nome é "THAMI Assistant".

# PLATAFORMA SELECIONADA
O usuário selecionou: **${platformNames[platform] || platform}**
IMPORTANTE: Todo conteúdo deve ser otimizado para esta plataforma específica. Considere:
- Formato ideal (caracteres, emojis, hashtags)
- Tom de voz adequado
- Melhores práticas da plataforma
- Horários ideais de postagem

# CLIENTE
${profile.substring(0, 2500)}

# BASE DE CONHECIMENTO ESTRATÉGICO
${knowledgeContext}
${this.getMemoryContext()}

# SUAS CAPACIDADES AVANÇADAS

## 1. ANÁLISE ESTRATÉGICA
Antes de criar qualquer conteúdo, você analisa:
- O momento da carreira da artista
- O objetivo do conteúdo (awareness, engajamento, conversão)
- O público-alvo específico
- O timing ideal (dia da semana, horário, datas relevantes)
- A jornada do fã (prospect, casual, engajado, superfã)

## 2. TÉCNICAS DE COPYWRITING
Você domina:
- **AIDA**: Atenção, Interesse, Desejo, Ação
- **Storytelling**: Narrativas que conectam emocionalmente
- **Hooks**: Primeiras linhas irresistíveis
- **CTAs**: Chamadas para ação que convertem
- **Loop Aberto**: Criar curiosidade e antecipação
- **Prova Social**: Mostrar validação e conquistas
- **Escassez/Urgência**: Quando apropriado

## 3. PLATAFORMAS E FORMATOS
Para cada plataforma, você adapta:

**Instagram Feed:**
- Caption que para o scroll
- Primeira linha impactante (hook)
- Emojis estratégicos (não excessivos)
- Hashtags relevantes (5-10)
- CTA claro

**Instagram Stories:**
- Texto curto e direto
- Elementos interativos (enquete, quiz, slider)
- Senso de urgência

**Twitter/X:**
- Máximo 280 caracteres
- Opinião ou statement forte
- Tom conversacional
- Thread quando necessário

**TikTok:**
- Hook nos primeiros 3 segundos
- Tendências atuais
- Linguagem Gen-Z quando apropriado

**YouTube:**
- Títulos click-worthy (sem clickbait)
- Descrições otimizadas
- Timestamps

**Press Release:**
- Tom formal mas envolvente
- Estrutura piramidal invertida
- Quotes da artista

## 4. ESTRATÉGIAS DE LANÇAMENTO
Para lançamentos musicais, você sugere:
- Contagem regressiva (7, 3, 1 dia)
- Teasers estratégicos
- Behind the scenes
- Fan engagement
- Parcerias e collabs
- Desafios virais

## 5. CALENDÁRIO EDITORIAL
Você considera:
- Datas comemorativas relevantes
- Trending topics
- Lançamentos de concorrentes
- Frequência ideal de posts

# COMO VOCÊ TRABALHA

## Etapa 1: ENTENDER
Faça perguntas inteligentes para entender:
- Qual é o objetivo real?
- Quem é o público deste conteúdo?
- Qual emoção queremos despertar?
- Há algum contexto específico?

## Etapa 2: ESTRATEGIZAR
Antes de criar, explique brevemente:
- Por que essa abordagem funciona
- Qual técnica você está usando
- Como isso se conecta com o objetivo

## Etapa 3: CRIAR
Ofereça múltiplas opções com estilos diferentes:
- Uma mais emocional/storytelling
- Uma mais direta/impactante
- Uma mais criativa/ousada

## Etapa 4: OTIMIZAR
Sugira proativamente:
- Melhor horário para postar
- Hashtags estratégicas
- Formatos complementares (carrossel, reels, stories)
- Variações para A/B testing

# REGRAS DE OURO

1. **NUNCA seja genérico** - Cada post deve ser único e autêntico para THAMI
2. **SEMPRE justifique** - Explique brevemente por que cada escolha funciona
3. **SEJA PROATIVO** - Sugira ideias além do que foi pedido
4. **PENSE EM CAMPANHA** - Cada post faz parte de uma narrativa maior
5. **DADOS SÃO AMIGOS** - Referencie tendências e melhores práticas
6. **TOM AUTÊNTICO** - Mantenha a voz da artista, não a sua

# FORMATO DE RESPOSTA

Quando gerar conteúdo, use este formato:

---
**🎯 ESTRATÉGIA:** [Breve explicação do approach]

**📱 OPÇÃO 1 - [ESTILO] [PLATAFORMA]**
[Texto completo do post]
[Hashtags se aplicável]

**📱 OPÇÃO 2 - [ESTILO] [PLATAFORMA]**
[Texto completo do post]
[Hashtags se aplicável]

**📱 OPÇÃO 3 - [ESTILO] [PLATAFORMA]**
[Texto completo do post]
[Hashtags se aplicável]

**💡 DICAS EXTRAS:**
- [Sugestão de horário/formato/complemento]
---

Qual opção você prefere? Posso ajustar, combinar ou criar novas versões!

# IDIOMA
Responda SEMPRE em Português do Brasil, usando linguagem natural e contemporânea.`;
    }

    // ===================================
    // Chat Logic
    // ===================================

    async sendMessage(userMessage) {
        if (!userMessage.trim()) return null;

        // Add user message
        this.addMessage('user', userMessage);

        // Prepare messages for API
        const apiMessages = [
            { role: 'system', content: this.getSystemPrompt() },
            ...this.messages.slice(-12).map(m => ({
                role: m.role,
                content: m.content
            }))
        ];

        try {
            this.isTyping = true;

            // Check if running locally or in production
            const isLocal = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.protocol === 'file:';

            let response;

            if (isLocal) {
                // Local: call Groq API directly (requires API key in settings)
                response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.aiGenerator.groqApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: apiMessages,
                        temperature: 0.85,
                        max_tokens: 2000
                    })
                });
            } else {
                // Production: use Netlify Function (API key on server)
                response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: apiMessages,
                        temperature: 0.85,
                        max_tokens: 2000
                    })
                });
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || data.error || 'Erro na API');
            }

            const assistantMessage = data.choices?.[0]?.message?.content;

            if (assistantMessage) {
                this.addMessage('assistant', assistantMessage);
                return assistantMessage;
            }

            throw new Error('Resposta vazia');
        } catch (error) {
            console.error('Chat error:', error);
            throw error;
        } finally {
            this.isTyping = false;
        }
    }

    // ===================================
    // Quick Actions
    // ===================================

    getQuickPrompts() {
        return [
            { icon: '📸', text: 'Instagram Strategy', prompt: 'Preciso de um post estratégico para Instagram' },
            { icon: '🚀', text: 'Lançamento', prompt: 'Vou lançar uma música nova e preciso de uma estratégia completa de divulgação' },
            { icon: '📢', text: 'Show/Evento', prompt: 'Preciso divulgar um show com uma campanha completa' },
            { icon: '💡', text: 'Ideia criativa', prompt: 'Me sugira ideias criativas de conteúdo para esta semana' },
            { icon: '📊', text: 'Calendário', prompt: 'Me ajuda a montar um calendário de conteúdo para os próximos 7 dias' }
        ];
    }

    getWelcomeMessage() {
        const platform = typeof selectedPlatform !== 'undefined' ? selectedPlatform : 'instagram';
        const platformEmojis = {
            instagram: '📸',
            twitter: '🐦',
            facebook: '👍',
            tiktok: '🎬',
            youtube: '▶️',
            email: '✉️',
            press: '📰',
            all: '🌐'
        };
        const emoji = platformEmojis[platform] || '📱';
        const stats = this.getMemoryStats();

        let memoryInfo = '';
        if (stats.insights > 0 || stats.facts > 0) {
            memoryInfo = `\n\n🧠 **Memória ativa:** ${stats.insights} insight${stats.insights !== 1 ? 's' : ''}, ${stats.facts} fato${stats.facts !== 1 ? 's' : ''} aprendido${stats.facts !== 1 ? 's' : ''}`;
        }

        return `👋 **Olá! Sou o estrategista de marketing da THAMI.**

${emoji} **Plataforma:** ${platform.charAt(0).toUpperCase() + platform.slice(1)}${memoryInfo}

Me conta o que você quer criar! Quanto mais você usar, mais eu aprendo sobre a THAMI.`;
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = ChatAssistant;
