// ===================================
// Knowledge Base Manager - Estratégias de Marketing
// Integrado com DataService para suporte multi-artista
// ===================================

class KnowledgeBase {
    constructor() {
        this.documents = []; // Documents shown in list (no globals for regular users)
        this.documentsWithGlobals = []; // All documents including globals (for AI context)
        this.initialized = false;
    }

    // ===================================
    // Initialization
    // ===================================

    async loadDocuments() {
        try {
            if (typeof dataService !== 'undefined' && dataService.isConnected()) {
                // Load documents for list (respects admin visibility rules)
                this.documents = await dataService.getKnowledgeDocuments();

                // Load documents WITH globals for AI context
                this.documentsWithGlobals = await dataService.getKnowledgeDocuments(null, true);
            } else {
                // Fallback to localStorage
                this.documents = JSON.parse(localStorage.getItem('knowledge_base')) || [];
                this.documentsWithGlobals = this.documents;
            }
            this.initialized = true;
        } catch (error) {
            console.error('Error loading knowledge documents:', error);
            this.documents = [];
            this.documentsWithGlobals = [];
        }
        return this.documents;
    }

    // ===================================
    // CRUD Operations
    // ===================================

    async addDocument(title, category, content) {
        try {
            let doc;
            if (typeof dataService !== 'undefined' && dataService.isConnected()) {
                doc = await dataService.addKnowledgeDocument(title, category, content);
            } else {
                // Fallback to local
                doc = {
                    id: Date.now().toString(),
                    title: title.trim(),
                    category: category,
                    content: content.trim(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.documents.unshift(doc);
                this.saveToLocalStorage();
            }

            // Add to local array if using dataService
            if (doc && typeof dataService !== 'undefined') {
                this.documents.unshift(doc);
            }

            return doc;
        } catch (error) {
            console.error('Error adding document:', error);
            throw error;
        }
    }

    async updateDocument(id, title, category, content) {
        try {
            let doc;
            if (typeof dataService !== 'undefined' && dataService.isConnected()) {
                doc = await dataService.updateKnowledgeDocument(id, title, category, content);
            } else {
                const index = this.documents.findIndex(d => d.id === id);
                if (index !== -1) {
                    this.documents[index] = {
                        ...this.documents[index],
                        title: title.trim(),
                        category: category,
                        content: content.trim(),
                        updatedAt: new Date().toISOString()
                    };
                    doc = this.documents[index];
                    this.saveToLocalStorage();
                }
            }

            // Update local array
            if (doc) {
                const index = this.documents.findIndex(d => d.id === id);
                if (index !== -1) {
                    this.documents[index] = doc;
                }
            }

            return doc;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    async deleteDocument(id) {
        try {
            if (typeof dataService !== 'undefined' && dataService.isConnected()) {
                await dataService.deleteKnowledgeDocument(id);
            }

            // Remove from local array
            this.documents = this.documents.filter(d => d.id !== id);
            this.saveToLocalStorage();

            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    getDocument(id) {
        return this.documents.find(d => d.id === id);
    }

    getAllDocuments() {
        return this.documents;
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('knowledge_base', JSON.stringify(this.documents));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // ===================================
    // Category Management
    // ===================================

    getCategories() {
        return [
            { id: 'strategy', name: 'Estratégia de Marketing', icon: 'target', priority: 1 },
            { id: 'briefing', name: 'Briefing de Campanha', icon: 'clipboard-list', priority: 2 },
            { id: 'voice', name: 'Tom de Voz', icon: 'mic', priority: 3 },
            { id: 'campaign', name: 'Campanha Ativa', icon: 'megaphone', priority: 4 },
            { id: 'release', name: 'Lançamento', icon: 'music', priority: 5 },
            { id: 'audience', name: 'Público-Alvo', icon: 'users', priority: 6 },
            { id: 'hashtags', name: 'Hashtags e Keywords', icon: 'hash', priority: 7 },
            { id: 'other', name: 'Outro', icon: 'file-text', priority: 10 }
        ];
    }

    getCategoryById(id) {
        return this.getCategories().find(c => c.id === id) || this.getCategories().find(c => c.id === 'other');
    }

    // ===================================
    // Search & Filter
    // ===================================

    searchDocuments(query, categoryFilter = 'all') {
        let results = this.documents;

        if (categoryFilter && categoryFilter !== 'all') {
            results = results.filter(d => d.category === categoryFilter);
        }

        if (query && query.trim()) {
            const q = query.toLowerCase().trim();
            results = results.filter(d =>
                d.title.toLowerCase().includes(q) ||
                d.content.toLowerCase().includes(q)
            );
        }

        return results;
    }

    // ===================================
    // AI Context Generation
    // ===================================

    // Get context for AI - includes global docs even for regular users
    async getContextForAIWithGlobals(maxLength = 3000) {
        let allDocs = [...this.documents];

        // Load global documents for AI context (even if not shown in list)
        try {
            if (typeof dataService !== 'undefined' && dataService.isConnected()) {
                const docsWithGlobal = await dataService.getKnowledgeDocuments(null, true);
                // Merge without duplicates
                const existingIds = new Set(allDocs.map(d => d.id));
                for (const doc of docsWithGlobal) {
                    if (!existingIds.has(doc.id)) {
                        allDocs.push(doc);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading global docs for AI:', error);
        }

        return this._formatContextFromDocs(allDocs, maxLength);
    }

    // Synchronous version using cached documents with globals (for AI context)
    getContextForAI(maxLength = 3000) {
        // Use documentsWithGlobals which includes global docs for AI training
        return this._formatContextFromDocs(this.documentsWithGlobals, maxLength);
    }

    // Internal method to format context from docs array
    _formatContextFromDocs(docs, maxLength) {
        if (docs.length === 0) return '';

        // Sort by category priority
        const sorted = [...docs].sort((a, b) => {
            const catA = this.getCategoryById(a.category);
            const catB = this.getCategoryById(b.category);
            return catA.priority - catB.priority;
        });

        let context = '\n\n=== BASE DE CONHECIMENTO E ESTRATÉGIAS ===\n';
        let currentLength = context.length;

        for (const doc of sorted) {
            const cat = this.getCategoryById(doc.category);
            const docText = `\n[${cat.name}] ${doc.title}:\n${doc.content}\n`;

            if (currentLength + docText.length > maxLength) break;

            context += docText;
            currentLength += docText.length;
        }

        return context;
    }

    // ===================================
    // Statistics
    // ===================================

    getStats() {
        const categoryCount = {};
        this.documents.forEach(d => {
            categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
        });

        return {
            total: this.documents.length,
            byCategory: categoryCount,
            totalCharacters: this.documents.reduce((sum, d) => sum + (d.content?.length || 0), 0)
        };
    }

    // ===================================
    // Export/Import
    // ===================================

    exportData() {
        return JSON.stringify(this.documents, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data)) {
                this.documents = data;
                this.saveToLocalStorage();
                return true;
            }
        } catch {
            console.error('Erro ao importar base de conhecimento');
        }
        return false;
    }

    clearAll() {
        this.documents = [];
        this.saveToLocalStorage();
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = KnowledgeBase;
