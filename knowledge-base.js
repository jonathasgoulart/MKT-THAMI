// ===================================
// Knowledge Base Manager - Estratégias de Marketing
// ===================================

class KnowledgeBase {
    constructor() {
        this.documents = this.loadDocuments();
    }

    // ===================================
    // Storage
    // ===================================

    loadDocuments() {
        try {
            return JSON.parse(localStorage.getItem('knowledge_base')) || [];
        } catch {
            return [];
        }
    }

    saveDocuments() {
        localStorage.setItem('knowledge_base', JSON.stringify(this.documents));
    }

    // ===================================
    // CRUD Operations
    // ===================================

    addDocument(title, category, content) {
        const doc = {
            id: Date.now().toString(),
            title: title.trim(),
            category: category,
            content: content.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.documents.unshift(doc);
        this.saveDocuments();
        return doc;
    }

    updateDocument(id, title, category, content) {
        const index = this.documents.findIndex(d => d.id === id);
        if (index !== -1) {
            this.documents[index] = {
                ...this.documents[index],
                title: title.trim(),
                category: category,
                content: content.trim(),
                updatedAt: new Date().toISOString()
            };
            this.saveDocuments();
            return this.documents[index];
        }
        return null;
    }

    deleteDocument(id) {
        this.documents = this.documents.filter(d => d.id !== id);
        this.saveDocuments();
    }

    getDocument(id) {
        return this.documents.find(d => d.id === id);
    }

    getAllDocuments() {
        return this.documents;
    }

    // ===================================
    // Category Management
    // ===================================

    getCategories() {
        return [
            { id: 'strategy', name: 'Estratégia de Marketing', icon: '🎯', priority: 1 },
            { id: 'briefing', name: 'Briefing de Campanha', icon: '📋', priority: 2 },
            { id: 'voice', name: 'Tom de Voz', icon: '🎤', priority: 3 },
            { id: 'campaign', name: 'Campanha Ativa', icon: '📢', priority: 4 },
            { id: 'release', name: 'Lançamento', icon: '🎵', priority: 5 },
            { id: 'audience', name: 'Público-Alvo', icon: '👥', priority: 6 },
            { id: 'hashtags', name: 'Hashtags e Keywords', icon: '#️⃣', priority: 7 },
            { id: 'other', name: 'Outro', icon: '📝', priority: 10 }
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

    getContextForAI(maxLength = 3000) {
        if (this.documents.length === 0) return '';

        // Sort by category priority
        const sorted = [...this.documents].sort((a, b) => {
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
            totalCharacters: this.documents.reduce((sum, d) => sum + d.content.length, 0)
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
                this.saveDocuments();
                return true;
            }
        } catch {
            console.error('Erro ao importar base de conhecimento');
        }
        return false;
    }

    clearAll() {
        this.documents = [];
        this.saveDocuments();
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = KnowledgeBase;
