// ===================================
// Content Manager - Save, Load, Export
// ===================================

class ContentManager {
    constructor() {
        this.storageKey = 'thami_content_library';
        this.library = this.loadLibrary();
    }

    loadLibrary() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading library:', error);
        }
        return [];
    }

    saveLibrary() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.library));
            return true;
        } catch (error) {
            console.error('Error saving library:', error);
            return false;
        }
    }

    // Save generated content
    saveContent(content, contentType, topic, metadata = {}) {
        const item = {
            id: Date.now().toString(),
            content: content,
            type: contentType,
            topic: topic,
            metadata: metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.library.unshift(item); // Add to beginning
        this.saveLibrary();
        return item;
    }

    // Get all content
    getAllContent() {
        return this.library;
    }

    // Get content by ID
    getContentById(id) {
        return this.library.find(item => item.id === id);
    }

    // Get recent content (last N items)
    getRecentContent(limit = 5) {
        return this.library.slice(0, limit);
    }

    // Filter content by type
    filterByType(type) {
        if (type === 'all') {
            return this.library;
        }
        return this.library.filter(item => item.type === type);
    }

    // Search content
    searchContent(query) {
        const lowerQuery = query.toLowerCase();
        return this.library.filter(item =>
            item.content.toLowerCase().includes(lowerQuery) ||
            item.topic.toLowerCase().includes(lowerQuery)
        );
    }

    // Update content
    updateContent(id, newContent) {
        const item = this.library.find(item => item.id === id);
        if (item) {
            item.content = newContent;
            item.updatedAt = new Date().toISOString();
            this.saveLibrary();
            return true;
        }
        return false;
    }

    // Delete content
    deleteContent(id) {
        const index = this.library.findIndex(item => item.id === id);
        if (index !== -1) {
            this.library.splice(index, 1);
            this.saveLibrary();
            return true;
        }
        return false;
    }

    // Clear all content
    clearAll() {
        this.library = [];
        this.saveLibrary();
    }

    // Get statistics
    getStats() {
        return {
            total: this.library.length,
            byType: {
                instagram: this.library.filter(i => i.type === 'instagram').length,
                facebook: this.library.filter(i => i.type === 'facebook').length,
                twitter: this.library.filter(i => i.type === 'twitter').length,
                tiktok: this.library.filter(i => i.type === 'tiktok').length,
                email: this.library.filter(i => i.type === 'email').length,
                press: this.library.filter(i => i.type === 'press').length
            }
        };
    }

    // Copy content to clipboard
    async copyToClipboard(content) {
        try {
            await navigator.clipboard.writeText(content);
            return true;
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = content;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                console.error('Copy failed:', err);
                return false;
            }
        }
    }

    // Download content as text file
    downloadAsText(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `thami-content-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Export all data as JSON
    exportAllData() {
        const data = {
            library: this.library,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thami-marketing-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import data from JSON
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.library && Array.isArray(data.library)) {
                this.library = data.library;
                this.saveLibrary();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // Render content card for library
    renderContentCard(item) {
        const typeIcons = {
            instagram: 'instagram',
            facebook: 'facebook',
            twitter: 'twitter',
            tiktok: 'video',
            email: 'mail',
            press: 'newspaper'
        };

        const typeNames = {
            instagram: 'Instagram',
            facebook: 'Facebook',
            twitter: 'Twitter/X',
            tiktok: 'TikTok',
            email: 'Email',
            press: 'Press Release'
        };

        const date = new Date(item.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const preview = item.content.length > 150
            ? item.content.substring(0, 150) + '...'
            : item.content;

        return `
            <div class="content-card" data-id="${item.id}">
                <div class="content-card-header">
                    <div class="content-type-badge">
                        <span class="type-icon"><i data-lucide="${typeIcons[item.type]}"></i></span>
                        <span class="type-name">${typeNames[item.type]}</span>
                    </div>
                    <div class="content-card-actions">
                        <button class="icon-btn copy-content-btn" data-id="${item.id}" title="Copiar"><i data-lucide="copy"></i></button>
                        <button class="icon-btn delete-content-btn" data-id="${item.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
                <div class="content-card-body">
                    <h4 class="content-topic">${item.topic}</h4>
                    <p class="content-preview">${preview}</p>
                </div>
                <div class="content-card-footer">
                    <span class="content-date">${date}</span>
                    <span class="content-chars">${item.content.length} caracteres</span>
                </div>
            </div>
        `;
    }

    // Render library view
    renderLibrary(filter = 'all', searchQuery = '') {
        const container = document.getElementById('library-content');
        if (!container) return;

        let items = this.filterByType(filter);

        if (searchQuery && searchQuery.trim() !== '') {
            items = this.searchContent(searchQuery);
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <p>Nenhum conteúdo encontrado</p>
                    <p class="empty-hint">${searchQuery ? 'Tente uma busca diferente' : 'Conteúdos salvos aparecerão aqui'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => this.renderContentCard(item)).join('');
        this.attachLibraryEventListeners();
        if (window.lucide) lucide.createIcons();
    }

    // Attach event listeners to library cards
    attachLibraryEventListeners() {
        // Copy buttons
        document.querySelectorAll('.copy-content-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const item = this.getContentById(id);
                if (item) {
                    const success = await this.copyToClipboard(item.content);
                    if (success) {
                        showToast('Conteúdo copiado!', 'success');
                    } else {
                        showToast('Erro ao copiar', 'error');
                    }
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-content-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (confirm('Deseja realmente excluir este conteúdo?')) {
                    if (this.deleteContent(id)) {
                        showToast('Conteúdo excluído', 'success');
                        this.renderLibrary();
                        updateDashboardStats();
                    }
                }
            });
        });

        // Card click to view full content
        document.querySelectorAll('.content-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.icon-btn')) {
                    const id = card.dataset.id;
                    this.showContentModal(id);
                }
            });
        });
    }

    // Show content in modal (simplified - just copy for now)
    showContentModal(id) {
        const item = this.getContentById(id);
        if (item) {
            // For now, just copy to clipboard
            this.copyToClipboard(item.content);
            showToast('Conteúdo copiado!', 'success');
        }
    }

    // Render recent content for dashboard
    renderRecentContent() {
        const container = document.getElementById('recent-content-list');
        if (!container) return;

        const recent = this.getRecentContent(3);

        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎨</div>
                    <p>Nenhum conteúdo gerado ainda</p>
                    <p class="empty-hint">Comece criando seu primeiro conteúdo!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recent.map(item => this.renderContentCard(item)).join('');
        this.attachLibraryEventListeners();
        if (window.lucide) lucide.createIcons();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentManager;
}
