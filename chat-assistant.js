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
    // Permanent Memory (Supabase + localStorage fallback)
    // ===================================

    // Memory limits (increased from 50/30)
    static MAX_INSIGHTS = 100;
    static MAX_FACTS = 100;

    loadMemory() {
        try {
            // Load from localStorage first (fast)
            const localMemory = JSON.parse(localStorage.getItem('chat_memory')) || {
                insights: [],
                preferences: {},
                learnedFacts: []
            };

            // Then try to sync from Supabase in background
            this.syncMemoryFromSupabase();

            return localMemory;
        } catch {
            return { insights: [], preferences: {}, learnedFacts: [] };
        }
    }

    async syncMemoryFromSupabase() {
        try {
            const supabase = getSupabase();
            if (!supabase || !authManager?.currentUser?.id) return;

            const { data, error } = await supabase
                .from('chat_memory')
                .select('*')
                .eq('user_id', authManager.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.log('[Memory] Error loading from Supabase:', error.message);
                return;
            }

            if (data) {
                // Merge Supabase data with local data
                const supabaseMemory = {
                    insights: data.insights || [],
                    learnedFacts: data.learned_facts || [],
                    preferences: data.preferences || {}
                };

                // Use whichever has more data (in case of conflicts)
                if (supabaseMemory.insights.length > this.memory.insights.length ||
                    supabaseMemory.learnedFacts.length > this.memory.learnedFacts.length) {
                    this.memory = supabaseMemory;
                    localStorage.setItem('chat_memory', JSON.stringify(this.memory));
                    console.log('[Memory] Synced from Supabase:', this.getMemoryStats());
                }
            }
        } catch (error) {
            console.log('[Memory] Supabase sync error:', error.message);
        }
    }

    saveMemory() {
        // Save to localStorage immediately
        localStorage.setItem('chat_memory', JSON.stringify(this.memory));

        // Save to Supabase in background (debounced)
        this.debouncedSaveToSupabase();
    }

    debouncedSaveToSupabase() {
        // Clear previous timeout
        if (this.saveTimeout) clearTimeout(this.saveTimeout);

        // Save after 2 seconds of no changes
        this.saveTimeout = setTimeout(() => {
            this.saveMemoryToSupabase();
        }, 2000);
    }

    async saveMemoryToSupabase() {
        try {
            const supabase = getSupabase();
            if (!supabase || !authManager?.currentUser?.id) return;

            const memoryData = {
                user_id: authManager.currentUser.id,
                insights: this.memory.insights,
                learned_facts: this.memory.learnedFacts,
                preferences: this.memory.preferences
            };

            const { error } = await supabase
                .from('chat_memory')
                .upsert(memoryData, { onConflict: 'user_id' });

            if (error) {
                console.log('[Memory] Error saving to Supabase:', error.message);
            } else {
                console.log('[Memory] Saved to Supabase');
            }
        } catch (error) {
            console.log('[Memory] Supabase save error:', error.message);
        }
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
            // Keep max insights (increased to 100)
            if (this.memory.insights.length > ChatAssistant.MAX_INSIGHTS) {
                this.memory.insights = this.memory.insights.slice(0, ChatAssistant.MAX_INSIGHTS);
            }
            this.saveMemory();
            return true;
        }
        return false;
    }

    addLearnedFact(fact) {
        if (!this.memory.learnedFacts.includes(fact)) {
            this.memory.learnedFacts.unshift(fact);
            // Keep max facts (increased to 100)
            if (this.memory.learnedFacts.length > ChatAssistant.MAX_FACTS) {
                this.memory.learnedFacts = this.memory.learnedFacts.slice(0, ChatAssistant.MAX_FACTS);
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
            context += '\n\n# FATOS APRENDIDOS SOBRE O ARTISTA\n';
            context += this.memory.learnedFacts.slice(0, 20).map(f => `- ${f}`).join('\n');
        }

        if (this.memory.insights.length > 0) {
            context += '\n\n# INSIGHTS DE CONVERSAS ANTERIORES\n';
            const recentInsights = this.memory.insights.slice(0, 15);
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

    async clearMemory() {
        this.memory = { insights: [], preferences: {}, learnedFacts: [] };
        localStorage.setItem('chat_memory', JSON.stringify(this.memory));

        // Also clear from Supabase
        try {
            const supabase = getSupabase();
            if (supabase && authManager?.currentUser?.id) {
                await supabase
                    .from('chat_memory')
                    .delete()
                    .eq('user_id', authManager.currentUser.id);
            }
        } catch (error) {
            console.log('[Memory] Error clearing from Supabase:', error.message);
        }
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
        const artistName = this.aiGenerator.profileManager.profile?.bio?.name || 'Artista';
        let knowledgeContext = '';
        if (this.knowledgeBase && this.knowledgeBase.documents && this.knowledgeBase.documents.length > 0) {
            knowledgeContext = this.knowledgeBase.getContextForAI(6000);
            console.log('[ChatAssistant] Briefings carregados:', this.knowledgeBase.documents.length, 'documentos');
        } else {
            console.log('[ChatAssistant] Nenhum briefing encontrado');
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
Você é um ESTRATEGISTA DE MARKETING DIGITAL especializado na indústria musical brasileira.

# REGRAS FUNDAMENTAIS (SIGA RIGOROSAMENTE!)

🚫 **PROIBIDO INVENTAR INFORMAÇÕES**
- NUNCA invente datas, números, nomes de músicas, shows, prêmios ou qualquer dado específico
- Se uma informação não estiver nos briefings ou perfil abaixo, NÃO inclua ela
- Se o usuário pedir algo que você não tem informação, diga: "Não encontrei essa informação nos seus briefings. Pode me contar mais sobre isso?"

✅ **USE APENAS OS DADOS FORNECIDOS**
- Baseie TODAS as suas respostas nas informações do PERFIL e BRIEFINGS abaixo
- Cite informações reais dos briefings (datas, nomes, eventos que estão escritos)
- Seja específico usando os dados que você TEM, não os que você imagina

# PLATAFORMA SELECIONADA
O usuário selecionou: **${platformNames[platform] || platform}**
- Otimize o formato para esta plataforma
- Use o tom de voz adequado
- Siga as melhores práticas

# PERFIL DO ARTISTA: ${artistName}
${profile.substring(0, 2500)}

# BRIEFINGS E ESTRATÉGIAS DO USUÁRIO
📋 **INFORMAÇÕES OFICIAIS** - Use EXATAMENTE estes dados:
${knowledgeContext || '(Nenhum briefing cadastrado - peça ao usuário mais informações)'}

${this.getMemoryContext()}

# SEU COMPORTAMENTO (SIGA À RISCA!)

## 🚨 REGRA PRINCIPAL: NÃO GERE CONTEÚDO DIRETO!
Quando o usuário pedir um post, conteúdo ou estratégia, você NÃO deve simplesmente gerar o conteúdo. Em vez disso, siga este processo:

### PASSO 1: ENTENDER (faça perguntas)
Faça 2-3 perguntas estratégicas para entender:
- Qual o objetivo real? (engajamento, vendas, awareness?)
- Qual o contexto específico? (lançamento, data especial, rotina?)
- Qual emoção quer transmitir? (inspiração, diversão, intimidade?)
- Tem alguma informação específica que devo incluir?

### PASSO 2: PROPOR CAMINHOS
Depois das respostas, apresente 2-3 CAMINHOS ESTRATÉGICOS (não o conteúdo ainda):
- "**Caminho A - [Nome]**: [Explique a estratégia em 1-2 linhas]"
- "**Caminho B - [Nome]**: [Explique a estratégia em 1-2 linhas]"

Pergunte qual caminho faz mais sentido.

### PASSO 3: EXPLICAR A ESTRATÉGIA
Antes de criar o conteúdo, explique:
- Qual técnica de marketing você vai usar (AIDA, storytelling, escassez, etc.)
- Por que essa abordagem funciona para o objetivo
- Como isso se conecta com o público-alvo

### PASSO 4: CRIAR COM JUSTIFICATIVA
Só então crie o conteúdo, sempre explicando:
- **📍 Estratégia usada:** [nome da técnica]
- **🎯 Por que funciona:** [1-2 linhas]
- **📱 Conteúdo:**
  [O post em si]

### PASSO 5: PEDIR FEEDBACK
Depois de apresentar, pergunte:
- "O que achou? Quer que eu ajuste algo?"
- "Prefere um tom mais [X] ou menos [Y]?"

## 🚫 NUNCA FAÇA ISSO:
- Inventar datas, shows, prêmios, números ou qualquer informação
- Gerar conteúdo sem antes fazer perguntas
- Ignorar os briefings cadastrados
- Dar respostas genéricas que servem para qualquer artista

## ✅ SEMPRE FAÇA ISSO:
- Use APENAS informações do perfil e briefings
- Cite a fonte: "Baseado no briefing X..."
- Se não souber algo, pergunte
- Explique suas escolhas estratégicas
- Seja consultivo, não um gerador automático

# TÉCNICAS DE MARKETING QUE VOCÊ DOMINA
(Use e EXPLIQUE qual está usando)

- **AIDA**: Atenção → Interesse → Desejo → Ação
- **Storytelling**: Narrativa emocional que conecta
- **Hook**: Primeira frase irresistível que para o scroll
- **Social Proof**: Validação social (números, depoimentos)
- **Scarcity**: Escassez/urgência quando apropriado
- **CTA Estratégico**: Chamada para ação clara
- **Open Loop**: Criar curiosidade para próximo conteúdo

# FORMATO DE SUAS RESPOSTAS

Quando for criar conteúdo final, use este formato:

---
**📍 ESTRATÉGIA:** [Nome da técnica usada]
**🎯 POR QUE FUNCIONA:** [Explicação em 1-2 linhas]

**📱 CONTEÚDO:**
[O post/texto em si]

**#️⃣ HASHTAGS:** (se aplicável)
[hashtags relevantes]

**💡 DICA:** [Sugestão de horário, formato ou complemento]

---

O que achou? Quer que eu ajuste algo?

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

            // Always use the secure backend proxy
            const provider = this.aiGenerator.provider || 'groq';

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    provider: provider,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

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
            { icon: 'camera', text: 'Instagram Strategy', prompt: 'Preciso de um post estratégico para Instagram' },
            { icon: 'megaphone', text: 'Show/Evento', prompt: 'Preciso divulgar um show com uma campanha completa' },
            { icon: 'lightbulb', text: 'Ideia criativa', prompt: 'Me sugira ideias criativas de conteúdo para esta semana' },
            { icon: 'calendar', text: 'Calendário', prompt: 'Me ajuda a montar um calendário de conteúdo para os próximos 7 dias' }
        ];
    }

    getWelcomeMessage() {
        const platform = typeof selectedPlatform !== 'undefined' ? selectedPlatform : 'instagram';
        const platformIcons = {
            instagram: 'camera',
            twitter: 'twitter',
            facebook: 'facebook',
            tiktok: 'video',
            youtube: 'play',
            email: 'mail',
            press: 'newspaper',
            all: 'globe'
        };
        const icon = platformIcons[platform] || 'smartphone';
        const stats = this.getMemoryStats();

        let memoryInfo = '';
        if (stats.insights > 0 || stats.facts > 0) {
            memoryInfo = `\n\n<i data-lucide="brain" style="width: 1.2em; height: 1.2em; vertical-align: middle;"></i> **Memória ativa:** ${stats.insights} insight${stats.insights !== 1 ? 's' : ''}, ${stats.facts} fato${stats.facts !== 1 ? 's' : ''} aprendido${stats.facts !== 1 ? 's' : ''}`;
        }

        const platformNameHtml = `<i data-lucide="${icon}" style="width: 1.2em; height: 1.2em; vertical-align: middle;"></i> **Plataforma:** ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;

        return `<i data-lucide="sparkles" style="width: 1.5em; height: 1.5em; vertical-align: middle; color: var(--primary-color);"></i> **Olá! Sou seu estrategista de marketing musical.**

${platformNameHtml}${memoryInfo}

Me conta o que você quer criar! Quanto mais você usar, mais eu aprendo sobre você.`;
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = ChatAssistant;
