// ===================================
// THAMI Marketing Assistant - Main App
// ===================================

// Global instances
let profileManager;
let aiGenerator;
let contentManager;
let knowledgeBase;
let chatAssistant;
let currentView = 'dashboard';
let currentContentType = null;
let currentProfileTab = 'bio';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize Supabase auth (if configured)
    if (typeof authManager !== 'undefined' && isSupabaseConfigured()) {
        try {
            await authManager.initialize();
            await dataService.initialize();

            // Update UI based on auth state
            updateAuthUI();

            // Listen for auth changes
            authManager.onAuthStateChange((event, user) => {
                updateAuthUI();
            });
        } catch (error) {
            console.log('Supabase not configured, using local mode');
        }
    }

    // Initialize managers
    profileManager = new ThamiProfile();
    aiGenerator = new AIGenerator(profileManager);
    contentManager = new ContentManager();
    knowledgeBase = new KnowledgeBase();
    chatAssistant = new ChatAssistant(aiGenerator, knowledgeBase);

    // Load knowledge base documents (async)
    knowledgeBase.loadDocuments().then(() => {
        renderKnowledgeList();
    });

    // Setup event listeners
    setupNavigation();
    setupDashboard();
    setupChat();
    setupProfile();
    setupLibrary();
    setupKnowledge();
    setupSettings();
    setupAuthButtons();

    // Initial render
    updateDashboardStats();
    contentManager.renderRecentContent();
    profileManager.renderProfilePreview();

    // Check API key status
    checkApiKeyStatus();
}

// Auth UI Update
function updateAuthUI() {
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('header-user-email');
    const adminLink = document.getElementById('admin-link');

    if (!userInfo) return;

    if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        userInfo.style.display = 'flex';
        userEmail.textContent = authManager.getDisplayName();

        if (authManager.isUserAdmin()) {
            adminLink.style.display = 'inline-block';
        } else {
            adminLink.style.display = 'none';
        }
    } else {
        userInfo.style.display = 'none';
    }
}

// Setup auth buttons
function setupAuthButtons() {
    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
                try {
                    await authManager.signOut();
                    showToast('Logout realizado com sucesso!', 'success');
                    window.location.href = '/login.html';
                } catch (error) {
                    showToast('Erro ao fazer logout', 'error');
                }
            }
        });
    }
}


// ===================================
// Navigation
// ===================================

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update view sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    const viewMap = {
        'dashboard': 'dashboard-view',
        'profile': 'profile-view',
        'library': 'library-view',
        'knowledge': 'knowledge-view',
        'settings': 'settings-view'
    };

    const targetView = document.getElementById(viewMap[view]);
    if (targetView) {
        targetView.classList.add('active');
        currentView = view;

        // Refresh content when switching views
        if (view === 'library') {
            contentManager.renderLibrary();
        } else if (view === 'profile') {
            profileManager.renderProfileEditor(currentProfileTab);
        } else if (view === 'dashboard') {
            updateDashboardStats();
            contentManager.renderRecentContent();
        } else if (view === 'knowledge') {
            renderKnowledgeList();
        }
    }
}

// ===================================
// Dashboard
// ===================================

function setupDashboard() {
    // Quick action buttons
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', () => {
            const contentType = card.dataset.contentType;
            openGenerator(contentType);
        });
    });
}

function updateDashboardStats() {
    const stats = contentManager.getStats();

    document.getElementById('stat-generated').textContent = stats.total;
    document.getElementById('stat-saved').textContent = stats.total;
}

function openGenerator(contentType) {
    currentContentType = contentType;

    // Show chat view instead of old generator
    document.getElementById('dashboard-view').classList.remove('active');
    document.getElementById('chat-view').classList.add('active');

    // Render chat messages
    renderChatMessages();

    // Focus input
    document.getElementById('chat-input')?.focus();
}

// ===================================
// Chat Interface
// ===================================

let selectedPlatform = 'instagram';

function setupChat() {
    // Platform selector
    const platformSelect = document.getElementById('platform-select');
    if (platformSelect) {
        platformSelect.addEventListener('change', (e) => {
            selectedPlatform = e.target.value;
            // Update chat assistant with new platform context
            if (chatAssistant.messages.length === 0) {
                renderChatMessages(); // Refresh welcome message
            }
        });
    }

    // Send button
    const sendBtn = document.getElementById('chat-send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            sendChatMessage();
        });
    }

    // Clear chat button
    const clearBtn = document.getElementById('clear-chat-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            chatAssistant.clearMessages();
            renderChatMessages();
            showToast('Nova conversa iniciada', 'info');
        });
    }

    // Chat input - Enter to send
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });

        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
        });
    }

    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.dataset.prompt;
            if (prompt) {
                document.getElementById('chat-input').value = prompt;
                sendChatMessage();
            }
        });
    });

    // AI Provider Selector (Chat)
    const chatAiProvider = document.getElementById('chat-ai-provider');
    if (chatAiProvider) {
        // Set initial value from aiGenerator
        chatAiProvider.value = aiGenerator.provider;

        chatAiProvider.addEventListener('change', (e) => {
            aiGenerator.setProvider(e.target.value);
            // Sync with settings page selector
            const settingsProvider = document.getElementById('ai-provider-select');
            if (settingsProvider) settingsProvider.value = e.target.value;
            showToast(`IA alterada para ${e.target.value === 'groq' ? 'Groq (LLaMA)' : 'Gemini'}`, 'info');
        });
    }

    // Initial render
    renderChatMessages();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Check API key
    if (!aiGenerator.hasApiKey()) {
        showToast('Configure sua API Key do Groq nas configurações', 'error');
        setTimeout(() => switchView('settings'), 1500);
        return;
    }

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Render user message
    renderChatMessages();

    // Show typing indicator
    showTypingIndicator();

    // Hide quick actions after first message
    const quickActions = document.getElementById('chat-quick-actions');
    if (quickActions && chatAssistant.messages.length > 0) {
        quickActions.style.display = 'none';
    }

    try {
        const response = await chatAssistant.sendMessage(message);
        hideTypingIndicator();
        renderChatMessages();
        scrollChatToBottom();
    } catch (error) {
        hideTypingIndicator();
        showToast('Erro ao enviar mensagem: ' + error.message, 'error');
        console.error('Chat error:', error);
    }
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // If no messages, show welcome
    if (chatAssistant.messages.length === 0) {
        container.innerHTML = `
            <div class="chat-message assistant">
                ${formatChatMessage(chatAssistant.getWelcomeMessage())}
            </div>
        `;
        // Show quick actions
        const quickActions = document.getElementById('chat-quick-actions');
        if (quickActions) quickActions.style.display = 'flex';
        return;
    }

    container.innerHTML = chatAssistant.messages.map(msg => `
        <div class="chat-message ${msg.role}">
            ${formatChatMessage(msg.content)}
        </div>
    `).join('');

    scrollChatToBottom();
}

function formatChatMessage(content) {
    // Convert markdown-style formatting to HTML
    let formatted = content
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/---/g, '<hr>')
        .replace(/•/g, '&bull;');

    // Add copy buttons to content options
    if (content.includes('Opção 1') || content.includes('Opção 2')) {
        formatted += `<button class="message-copy-btn" onclick="copyLastSuggestions()">📋 Copiar Sugestões</button>`;
    }

    return formatted;
}

function showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message assistant typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    container.appendChild(typingDiv);
    scrollChatToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function copyLastSuggestions() {
    const messages = chatAssistant.messages;
    const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
    if (lastAssistant) {
        navigator.clipboard.writeText(lastAssistant.content)
            .then(() => showToast('Sugestões copiadas!', 'success'))
            .catch(() => showToast('Erro ao copiar', 'error'));
    }
}

function openChatWithContentType(contentType) {
    currentContentType = contentType;

    // Switch to chat view
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');

    // If no messages, show welcome
    if (chatAssistant.messages.length === 0) {
        renderChatMessages();
    }

    // Focus input
    document.getElementById('chat-input')?.focus();
}

// ===================================
// Profile Management
// ===================================

function setupProfile() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            // Update active tab
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Render editor for selected tab
            currentProfileTab = tab;
            profileManager.renderProfileEditor(tab);
        });
    });

    // Save profile button
    document.getElementById('save-profile-btn').addEventListener('click', () => {
        const updatedProfile = profileManager.collectFormData(currentProfileTab);
        if (profileManager.saveProfile(updatedProfile)) {
            showToast('Perfil salvo com sucesso!', 'success');
            profileManager.renderProfilePreview();
        } else {
            showToast('Erro ao salvar perfil', 'error');
        }
    });

    // Reset profile button
    document.getElementById('reset-profile-btn').addEventListener('click', () => {
        if (confirm('Deseja realmente restaurar o perfil padrão? Todas as alterações serão perdidas.')) {
            profileManager.resetToDefault();
            profileManager.renderProfileEditor(currentProfileTab);
            profileManager.renderProfilePreview();
            showToast('Perfil restaurado para o padrão', 'info');
        }
    });

    // Initial render
    profileManager.renderProfileEditor('bio');
}

// ===================================
// Library
// ===================================

function setupLibrary() {
    // Search
    const searchInput = document.getElementById('library-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            const filter = document.getElementById('library-filter').value;
            contentManager.renderLibrary(filter, query);
        });
    }

    // Filter
    const filterSelect = document.getElementById('library-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const filter = e.target.value;
            const query = document.getElementById('library-search').value;
            contentManager.renderLibrary(filter, query);
        });
    }
}

// ===================================
// Knowledge Base
// ===================================

function setupKnowledge() {
    // Add Document Button
    const addBtn = document.getElementById('add-knowledge-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showKnowledgeForm();
        });
    }

    // Cancel Button
    const cancelBtn = document.getElementById('cancel-knowledge-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hideKnowledgeForm();
        });
    }

    // Save Button
    const saveBtn = document.getElementById('save-knowledge-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveKnowledgeDocument();
        });
    }

    // Search
    const searchInput = document.getElementById('knowledge-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderKnowledgeList();
        });
    }

    // Filter
    const filterSelect = document.getElementById('knowledge-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            renderKnowledgeList();
        });
    }

    // File Upload
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileInput = document.getElementById('knowledge-file');
    const fileNameSpan = document.getElementById('file-name');

    if (fileUploadBtn && fileInput) {
        fileUploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            fileNameSpan.textContent = file.name;
            const contentTextarea = document.getElementById('knowledge-content');

            // Check file type
            const fileName = file.name.toLowerCase();

            if (fileName.endsWith('.pdf')) {
                // PDF file - use PDF.js to extract text
                try {
                    fileNameSpan.textContent = `${file.name} (processando...)`;

                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }

                    contentTextarea.value = fullText.trim();
                    fileNameSpan.textContent = `${file.name} (${pdf.numPages} páginas)`;
                    showToast(`PDF "${file.name}" importado com sucesso!`, 'success');
                } catch (error) {
                    console.error('PDF error:', error);
                    showToast('Erro ao processar PDF', 'error');
                    fileNameSpan.textContent = '';
                }
            } else {
                // Text file (.txt, .md)
                const reader = new FileReader();
                reader.onload = (event) => {
                    contentTextarea.value = event.target.result;
                    showToast(`Arquivo "${file.name}" importado!`, 'success');
                };
                reader.onerror = () => {
                    showToast('Erro ao ler arquivo', 'error');
                };
                reader.readAsText(file);
            }
        });
    }

    // Initial render
    renderKnowledgeList();
}

function showKnowledgeForm(editId = null) {
    const container = document.getElementById('knowledge-form-container');
    const titleEl = document.getElementById('knowledge-form-title');
    const titleInput = document.getElementById('knowledge-title');
    const categoryInput = document.getElementById('knowledge-category');
    const contentInput = document.getElementById('knowledge-content');
    const editIdInput = document.getElementById('knowledge-edit-id');

    if (editId) {
        const doc = knowledgeBase.getDocument(editId);
        if (doc) {
            titleEl.textContent = 'Editar Documento';
            titleInput.value = doc.title;
            categoryInput.value = doc.category;
            contentInput.value = doc.content;
            editIdInput.value = doc.id;
        }
    } else {
        titleEl.textContent = 'Novo Documento';
        titleInput.value = '';
        categoryInput.value = 'strategy';
        contentInput.value = '';
        editIdInput.value = '';
    }

    container.style.display = 'block';
    titleInput.focus();
}

function hideKnowledgeForm() {
    document.getElementById('knowledge-form-container').style.display = 'none';
}

async function saveKnowledgeDocument() {
    const title = document.getElementById('knowledge-title').value.trim();
    const category = document.getElementById('knowledge-category').value;
    const content = document.getElementById('knowledge-content').value.trim();
    const editId = document.getElementById('knowledge-edit-id').value;

    if (!title) {
        showToast('Por favor, informe um título', 'error');
        return;
    }

    if (!content) {
        showToast('Por favor, adicione o conteúdo', 'error');
        return;
    }

    try {
        if (editId) {
            await knowledgeBase.updateDocument(editId, title, category, content);
            showToast('Documento atualizado!', 'success');
        } else {
            await knowledgeBase.addDocument(title, category, content);
            showToast('Documento adicionado!', 'success');
        }

        hideKnowledgeForm();
        renderKnowledgeList();
    } catch (error) {
        console.error('Error saving document:', error);
        showToast('Erro ao salvar documento', 'error');
    }
}

async function deleteKnowledgeDocument(id) {
    if (confirm('Deseja excluir este documento?')) {
        try {
            await knowledgeBase.deleteDocument(id);
            showToast('Documento excluído', 'info');
            renderKnowledgeList();
        } catch (error) {
            console.error('Error deleting document:', error);
            showToast('Erro ao excluir documento', 'error');
        }
    }
}

function renderKnowledgeList() {
    const searchQuery = document.getElementById('knowledge-search')?.value || '';
    const categoryFilter = document.getElementById('knowledge-filter')?.value || 'all';
    const documents = knowledgeBase.searchDocuments(searchQuery, categoryFilter);
    const container = document.getElementById('knowledge-list');
    const statsEl = document.getElementById('knowledge-stats');

    // Update stats
    const stats = knowledgeBase.getStats();
    if (statsEl) {
        statsEl.innerHTML = `
            <span>📄 ${stats.total} documento${stats.total !== 1 ? 's' : ''}</span>
            <span>📝 ${stats.totalCharacters.toLocaleString()} caracteres de contexto</span>
        `;
    }

    if (documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <p>${searchQuery || categoryFilter !== 'all' ? 'Nenhum documento encontrado' : 'Nenhuma estratégia cadastrada ainda'}</p>
                <p class="empty-hint">Adicione briefings, estratégias e conteúdos para alimentar a IA</p>
            </div>
        `;
        return;
    }

    container.innerHTML = documents.map(doc => {
        const cat = knowledgeBase.getCategoryById(doc.category);
        const date = new Date(doc.updatedAt).toLocaleDateString('pt-BR');
        const preview = doc.content.length > 200 ? doc.content.substring(0, 200) + '...' : doc.content;

        return `
            <div class="knowledge-item">
                <div class="knowledge-item-header">
                    <div>
                        <h4 class="knowledge-item-title">
                            <span class="knowledge-category-badge">${cat.icon} ${cat.name}</span>
                        </h4>
                        <strong style="font-size: 1.1rem;">${doc.title}</strong>
                    </div>
                    <div class="knowledge-item-actions">
                        <button class="icon-btn" onclick="showKnowledgeForm('${doc.id}')" title="Editar">✏️</button>
                        <button class="icon-btn" onclick="deleteKnowledgeDocument('${doc.id}')" title="Excluir">🗑️</button>
                    </div>
                </div>
                <div class="knowledge-item-content">
                    ${preview.replace(/\n/g, '<br>')}
                </div>
                <div class="knowledge-item-meta">
                    <span>Atualizado em ${date}</span>
                    <span>${doc.content.length} caracteres</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================
// Settings
// ===================================

function setupSettings() {
    // AI Provider Selection
    const providerSelect = document.getElementById('ai-provider-select');
    if (providerSelect) {
        providerSelect.value = aiGenerator.provider;
        providerSelect.addEventListener('change', (e) => {
            aiGenerator.setProvider(e.target.value);
            // Sync with chat selector
            const chatProvider = document.getElementById('chat-ai-provider');
            if (chatProvider) chatProvider.value = e.target.value;
            updateProviderUI();
            showToast(`Provedor alterado para ${e.target.value === 'groq' ? 'Groq' : 'Gemini'}`, 'info');
        });
        updateProviderUI();
    }

    // Save Groq API Key
    const saveGroqBtn = document.getElementById('save-groq-key-btn');
    if (saveGroqBtn) {
        saveGroqBtn.addEventListener('click', () => {
            const apiKey = document.getElementById('groq-api-key-input').value.trim();
            if (!apiKey) {
                showToast('Por favor, insira uma API Key do Groq', 'error');
                return;
            }
            aiGenerator.saveGroqApiKey(apiKey);
            showToast('API Key do Groq salva com sucesso!', 'success');
            updateGroqStatus();
            document.getElementById('groq-api-key-input').value = '';
        });
    }

    // Test Groq Connection
    const testGroqBtn = document.getElementById('test-groq-btn');
    if (testGroqBtn) {
        testGroqBtn.addEventListener('click', async () => {
            const btn = testGroqBtn;
            const originalText = btn.textContent;
            btn.textContent = 'Testando...';
            btn.disabled = true;

            try {
                // Temporarily set provider to groq for testing
                const prevProvider = aiGenerator.provider;
                aiGenerator.provider = 'groq';
                const result = await aiGenerator.testConnection();
                aiGenerator.provider = prevProvider;

                if (result.success) {
                    alert(`✅ CONECTADO AO GROQ!\n\nModelo: ${result.model}\nVocê já pode gerar conteúdo com IA gratuita!`);
                    updateGroqStatus();
                } else {
                    alert(`❌ FALHA NA CONEXÃO\n\nErro: ${result.error}\n\nVerifique sua chave do Groq.`);
                }
            } catch (error) {
                alert('❌ Erro inesperado: ' + error.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // Save Gemini API Key
    document.getElementById('save-api-key-btn').addEventListener('click', () => {
        const apiKey = document.getElementById('api-key-input').value.trim();

        if (!apiKey) {
            showToast('Por favor, insira uma API Key', 'error');
            return;
        }

        aiGenerator.saveApiKey(apiKey);
        showToast('API Key do Gemini salva!', 'success');
        checkApiKeyStatus();
        document.getElementById('api-key-input').value = '';
    });

    // Test Gemini Connection
    document.getElementById('test-connection-btn').addEventListener('click', async () => {
        const btn = document.getElementById('test-connection-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Testando...';
        btn.disabled = true;

        try {
            const prevProvider = aiGenerator.provider;
            aiGenerator.provider = 'gemini';
            const result = await aiGenerator.testConnection();
            aiGenerator.provider = prevProvider;

            if (result.success) {
                alert(`✅ CONECTADO AO GEMINI!\n\nModelo: ${result.model}`);
            } else {
                if (result.error === "GOOGLE_ACCOUNT_ERROR") {
                    alert(
                        "🚨 BLOQUEIO DE CONTA DETECTADO\n\n" +
                        "Recomendamos usar o Groq como alternativa gratuita!\n\n" +
                        "Ou tente criar uma nova chave em um NOVO projeto no AI Studio."
                    );
                } else {
                    alert(`❌ FALHA NA CONEXÃO\n\nErro: ${result.error}`);
                }
            }
        } catch (error) {
            alert('❌ Erro inesperado: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // Manual Mode Toggle
    const manualToggle = document.getElementById('manual-mode-toggle');
    if (manualToggle) {
        manualToggle.checked = aiGenerator.manualMode;
        manualToggle.addEventListener('change', (e) => {
            const active = e.target.checked;
            aiGenerator.setManualMode(active);
            showToast(active ? 'Modo Manual ativado' : 'IA ativada', 'info');
            updateGroqStatus();
            checkApiKeyStatus();

            const btnText = document.querySelector('.generate-btn .btn-text');
            if (btnText) {
                btnText.textContent = active ? 'Criar Rascunho' : 'Gerar Conteúdo';
            }
        });
    }

    // Export data
    document.getElementById('export-data-btn').addEventListener('click', () => {
        contentManager.exportAllData();
        showToast('Dados exportados!', 'success');
    });

    // Import data
    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const success = contentManager.importData(event.target.result);
                if (success) {
                    showToast('Dados importados com sucesso!', 'success');
                    updateDashboardStats();
                    contentManager.renderRecentContent();
                } else {
                    showToast('Erro ao importar dados', 'error');
                }
            };
            reader.readAsText(file);
        }
    });

    // Clear all data
    document.getElementById('clear-data-btn').addEventListener('click', () => {
        if (confirm('Deseja realmente limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
            if (confirm('Tem certeza absoluta? Todos os conteúdos salvos serão perdidos.')) {
                contentManager.clearAll();
                profileManager.resetToDefault();
                localStorage.removeItem('discovered_models');
                showToast('Todos os dados foram limpos', 'info');
                updateDashboardStats();
                contentManager.renderRecentContent();
                profileManager.renderProfileEditor(currentProfileTab);
            }
        }
    });

    // Initial status update
    updateGroqStatus();
    checkApiKeyStatus();
}

function updateProviderUI() {
    const groqSettings = document.getElementById('groq-settings');
    const geminiSettings = document.getElementById('gemini-settings');

    if (aiGenerator.provider === 'groq') {
        groqSettings.style.opacity = '1';
        geminiSettings.style.opacity = '0.5';
    } else {
        groqSettings.style.opacity = '0.5';
        geminiSettings.style.opacity = '1';
    }
}

function updateGroqStatus() {
    const statusDiv = document.getElementById('groq-status');
    if (!statusDiv) return;

    if (aiGenerator.manualMode) {
        statusDiv.innerHTML = '<div class="status-message info">✨ Modo Manual Ativo</div>';
        return;
    }

    if (aiGenerator.groqApiKey) {
        statusDiv.innerHTML = `
            <div class="status-message success">✓ API Key do Groq configurada</div>
            <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 8px;">
                🚀 Pronto para gerar conteúdo com Llama 3.3 70B!
            </p>
        `;
    } else {
        statusDiv.innerHTML = `
            <div class="status-message error">⚠️ API Key do Groq não configurada</div>
            <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 8px;">
                Obtenha sua chave gratuita em <a href="https://console.groq.com/keys" target="_blank" style="color: #4facfe;">console.groq.com</a>
            </p>
        `;
    }
}

function checkApiKeyStatus() {
    const statusDiv = document.getElementById('api-key-status');
    if (!statusDiv) return;

    if (aiGenerator.manualMode) {
        statusDiv.innerHTML = '<div class="status-message info">✨ Modo Manual Ativo</div>';
        return;
    }

    if (aiGenerator.apiKey) {
        statusDiv.innerHTML = '<div class="status-message success">✓ API Key do Gemini configurada</div>';
    } else {
        statusDiv.innerHTML = '<div class="status-message error">⚠️ API Key não configurada</div>';
    }
}

// ===================================
// Toast Notifications
// ===================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (container.contains(toast)) container.removeChild(toast);
        }, 300);
    }, 3000);
}

// ===================================
// Utility Functions
// ===================================

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Truncate text
function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ===================================
// Additional CSS for dynamic elements
// ===================================

// Add styles for content cards and dynamic elements
const additionalStyles = `
<style>
.achievement-item,
.event-item,
.release-item {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}

.content-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    cursor: pointer;
    transition: all var(--transition-base);
}

.content-card:hover {
    background: var(--bg-tertiary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.content-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
}

.content-type-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-card);
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
}

.type-icon {
    font-size: 1.1rem;
}

.content-card-actions {
    display: flex;
    gap: var(--spacing-xs);
}

.content-card-body {
    margin-bottom: var(--spacing-sm);
}

.content-topic {
    font-size: 1rem;
    margin-bottom: var(--spacing-xs);
    color: var(--text-primary);
}

.content-preview {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
}

.content-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--divider-color);
    font-size: 0.75rem;
    color: var(--text-tertiary);
}

.loading-text {
    color: var(--text-tertiary);
    font-style: italic;
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// ===================================
// Multi-Artist Management
// ===================================

function setupArtistSelector() {
    const dropdownBtn = document.getElementById('artist-dropdown-btn');
    const dropdownWrapper = document.querySelector('.artist-dropdown-wrapper');
    const artistSelector = document.getElementById('artist-selector');
    const addArtistBtn = document.getElementById('add-artist-btn');
    const addArtistModal = document.getElementById('add-artist-modal');
    const cancelAddArtist = document.getElementById('cancel-add-artist');
    const confirmAddArtist = document.getElementById('confirm-add-artist');

    if (!dropdownBtn || !artistSelector) return;

    // Show artist selector if logged in
    if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        artistSelector.style.display = 'block';
        loadArtists();
    }

    // Toggle dropdown
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownWrapper.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownWrapper?.classList.remove('open');
    });

    // Add artist button
    if (addArtistBtn) {
        addArtistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownWrapper.classList.remove('open');
            showAddArtistModal();
        });
    }

    // Cancel add artist
    if (cancelAddArtist) {
        cancelAddArtist.addEventListener('click', hideAddArtistModal);
    }

    // Confirm add artist
    if (confirmAddArtist) {
        confirmAddArtist.addEventListener('click', createArtist);
    }

    // Close modal on overlay click
    if (addArtistModal) {
        addArtistModal.addEventListener('click', (e) => {
            if (e.target === addArtistModal) {
                hideAddArtistModal();
            }
        });
    }
}

async function loadArtists() {
    const artistList = document.getElementById('artist-list');
    const currentArtistName = document.getElementById('current-artist-name');

    if (!artistList) return;

    try {
        const artists = await dataService.getArtists();

        if (artists.length === 0) {
            artistList.innerHTML = '<p style="padding: 8px 16px; color: var(--text-tertiary);">Nenhum artista</p>';
            currentArtistName.textContent = 'Adicionar Artista';
            return;
        }

        artistList.innerHTML = artists.map(artist => `
            <button class="artist-item ${artist.isActive ? 'active' : ''}" 
                    data-artist-id="${artist.id}"
                    onclick="switchArtist('${artist.id}')">
                <span class="artist-item-name">${artist.name}</span>
                <span class="artist-item-genre">${artist.genre || ''}</span>
                ${artist.isActive ? '<span class="artist-item-check">✓</span>' : ''}
            </button>
        `).join('');

        // Update current artist name in dropdown button
        const activeArtist = artists.find(a => a.isActive);
        if (activeArtist) {
            currentArtistName.textContent = activeArtist.name;
            // Store active artist ID in dataService
            dataService.activeArtistId = activeArtist.id;
        }
    } catch (error) {
        console.error('Error loading artists:', error);
        artistList.innerHTML = '<p style="padding: 8px 16px; color: var(--text-tertiary);">Erro ao carregar</p>';
    }
}

async function switchArtist(artistId) {
    try {
        await dataService.setActiveArtist(artistId);

        // Close dropdown
        document.querySelector('.artist-dropdown-wrapper')?.classList.remove('open');

        // Reload artists list
        await loadArtists();

        // Reload profile if on profile view
        if (currentView === 'profile') {
            const profile = await dataService.getArtistProfile(artistId);
            if (profile) {
                profileManager.profile = profile;
                profileManager.renderProfileEditor(currentProfileTab);
            }
        }

        // Reload knowledge base
        if (typeof knowledgeBase !== 'undefined') {
            await knowledgeBase.loadDocuments();
            if (currentView === 'knowledge') {
                renderKnowledgeList();
            }
        }

        // Clear chat for new artist context
        chatAssistant.clearMessages();
        renderChatMessages();

        showToast('Artista alterado!', 'success');
    } catch (error) {
        console.error('Error switching artist:', error);
        showToast('Erro ao trocar artista', 'error');
    }
}

function showAddArtistModal() {
    const modal = document.getElementById('add-artist-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('new-artist-name')?.focus();
    }
}

function hideAddArtistModal() {
    const modal = document.getElementById('add-artist-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('new-artist-name').value = '';
        document.getElementById('new-artist-genre').value = '';
    }
}

async function createArtist() {
    const nameInput = document.getElementById('new-artist-name');
    const genreInput = document.getElementById('new-artist-genre');

    const name = nameInput?.value.trim();
    const genre = genreInput?.value.trim();

    if (!name) {
        showToast('Por favor, informe o nome do artista', 'error');
        return;
    }

    try {
        await dataService.createArtist(name, genre);
        hideAddArtistModal();
        await loadArtists();
        showToast(`Artista "${name}" criado!`, 'success');
    } catch (error) {
        console.error('Error creating artist:', error);
        showToast(error.message || 'Erro ao criar artista', 'error');
    }
}

// Initialize artist selector after auth is ready
const originalUpdateAuthUI = updateAuthUI;
updateAuthUI = function () {
    originalUpdateAuthUI();

    // Also show/hide and load artist selector
    const artistSelector = document.getElementById('artist-selector');
    if (artistSelector) {
        if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
            artistSelector.style.display = 'block';
            loadArtists();
        } else {
            artistSelector.style.display = 'none';
        }
    }
};

// Setup artist selector on app init
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for auth to initialize
    setTimeout(setupArtistSelector, 500);
});

