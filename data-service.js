// =====================================================
// Data Service - Supabase Database Operations
// Handles all database operations for profiles and knowledge base
// =====================================================

class DataService {
    constructor() {
        this.isOnline = false;
    }

    // =====================================================
    // Initialization
    // =====================================================

    async initialize() {
        const supabase = getSupabase();
        this.isOnline = !!supabase && isSupabaseConfigured();
        return this.isOnline;
    }

    isConnected() {
        return this.isOnline && authManager.isAuthenticated();
    }

    // =====================================================
    // Artist Profile Operations
    // =====================================================

    async getArtistProfile() {
        if (!this.isConnected()) {
            return this.getLocalProfile();
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        const { data, error } = await supabase
            .from('artist_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error fetching artist profile:', error);
            return this.getLocalProfile();
        }

        return this.transformProfileFromDB(data);
    }

    async saveArtistProfile(profile) {
        if (!this.isConnected()) {
            return this.saveLocalProfile(profile);
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        const dbProfile = this.transformProfileToDB(profile);

        const { data, error } = await supabase
            .from('artist_profiles')
            .upsert({
                user_id: userId,
                ...dbProfile
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving artist profile:', error);
            throw error;
        }

        return this.transformProfileFromDB(data);
    }

    // Transform profile from database format
    transformProfileFromDB(dbProfile) {
        if (!dbProfile) return null;

        return {
            bio: dbProfile.bio || {},
            achievements: dbProfile.achievements || [],
            events: dbProfile.events || [],
            releases: dbProfile.releases || [],
            social: dbProfile.social || {}
        };
    }

    // Transform profile to database format
    transformProfileToDB(profile) {
        return {
            bio: profile.bio || {},
            achievements: profile.achievements || [],
            events: profile.events || [],
            releases: profile.releases || [],
            social: profile.social || {}
        };
    }

    // Local storage fallback
    getLocalProfile() {
        try {
            const stored = localStorage.getItem('thami_profile');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading local profile:', error);
        }
        return null;
    }

    saveLocalProfile(profile) {
        try {
            localStorage.setItem('thami_profile', JSON.stringify(profile));
            return profile;
        } catch (error) {
            console.error('Error saving local profile:', error);
            throw error;
        }
    }

    // =====================================================
    // Knowledge Base Operations
    // =====================================================

    async getKnowledgeDocuments() {
        if (!this.isConnected()) {
            return this.getLocalKnowledgeDocuments();
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        // Fetch user's documents AND global documents
        const { data, error } = await supabase
            .from('knowledge_documents')
            .select('*')
            .or(`user_id.eq.${userId},is_global.eq.true`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching knowledge documents:', error);
            return this.getLocalKnowledgeDocuments();
        }

        return data.map(doc => this.transformDocumentFromDB(doc));
    }

    async addKnowledgeDocument(title, category, content) {
        if (!this.isConnected()) {
            return this.addLocalKnowledgeDocument(title, category, content);
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        const { data, error } = await supabase
            .from('knowledge_documents')
            .insert({
                user_id: userId,
                title: title.trim(),
                category,
                content: content.trim(),
                is_global: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding knowledge document:', error);
            throw error;
        }

        return this.transformDocumentFromDB(data);
    }

    async updateKnowledgeDocument(id, title, category, content) {
        if (!this.isConnected()) {
            return this.updateLocalKnowledgeDocument(id, title, category, content);
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('knowledge_documents')
            .update({
                title: title.trim(),
                category,
                content: content.trim()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating knowledge document:', error);
            throw error;
        }

        return this.transformDocumentFromDB(data);
    }

    async deleteKnowledgeDocument(id) {
        if (!this.isConnected()) {
            return this.deleteLocalKnowledgeDocument(id);
        }

        const supabase = getSupabase();

        const { error } = await supabase
            .from('knowledge_documents')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting knowledge document:', error);
            throw error;
        }

        return true;
    }

    async getKnowledgeDocument(id) {
        if (!this.isConnected()) {
            return this.getLocalKnowledgeDocument(id);
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('knowledge_documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching knowledge document:', error);
            return null;
        }

        return this.transformDocumentFromDB(data);
    }

    // Transform document from database format
    transformDocumentFromDB(dbDoc) {
        return {
            id: dbDoc.id,
            title: dbDoc.title,
            category: dbDoc.category,
            content: dbDoc.content,
            isGlobal: dbDoc.is_global,
            createdAt: dbDoc.created_at,
            updatedAt: dbDoc.updated_at
        };
    }

    // Local storage fallback for knowledge documents
    getLocalKnowledgeDocuments() {
        try {
            return JSON.parse(localStorage.getItem('knowledge_base')) || [];
        } catch {
            return [];
        }
    }

    addLocalKnowledgeDocument(title, category, content) {
        const docs = this.getLocalKnowledgeDocuments();
        const doc = {
            id: Date.now().toString(),
            title: title.trim(),
            category,
            content: content.trim(),
            isGlobal: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        docs.unshift(doc);
        localStorage.setItem('knowledge_base', JSON.stringify(docs));
        return doc;
    }

    updateLocalKnowledgeDocument(id, title, category, content) {
        const docs = this.getLocalKnowledgeDocuments();
        const index = docs.findIndex(d => d.id === id);
        if (index !== -1) {
            docs[index] = {
                ...docs[index],
                title: title.trim(),
                category,
                content: content.trim(),
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('knowledge_base', JSON.stringify(docs));
            return docs[index];
        }
        return null;
    }

    deleteLocalKnowledgeDocument(id) {
        let docs = this.getLocalKnowledgeDocuments();
        docs = docs.filter(d => d.id !== id);
        localStorage.setItem('knowledge_base', JSON.stringify(docs));
        return true;
    }

    getLocalKnowledgeDocument(id) {
        const docs = this.getLocalKnowledgeDocuments();
        return docs.find(d => d.id === id) || null;
    }

    // =====================================================
    // Admin Operations (Global Knowledge)
    // =====================================================

    async addGlobalDocument(title, category, content) {
        if (!authManager.isUserAdmin()) {
            throw new Error('Apenas administradores podem criar documentos globais');
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('knowledge_documents')
            .insert({
                user_id: authManager.getUserId(),
                title: title.trim(),
                category,
                content: content.trim(),
                is_global: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding global document:', error);
            throw error;
        }

        return this.transformDocumentFromDB(data);
    }

    async updateGlobalDocument(id, title, category, content) {
        if (!authManager.isUserAdmin()) {
            throw new Error('Apenas administradores podem editar documentos globais');
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('knowledge_documents')
            .update({
                title: title.trim(),
                category,
                content: content.trim()
            })
            .eq('id', id)
            .eq('is_global', true)
            .select()
            .single();

        if (error) {
            console.error('Error updating global document:', error);
            throw error;
        }

        return this.transformDocumentFromDB(data);
    }

    async deleteGlobalDocument(id) {
        if (!authManager.isUserAdmin()) {
            throw new Error('Apenas administradores podem deletar documentos globais');
        }

        const supabase = getSupabase();

        const { error } = await supabase
            .from('knowledge_documents')
            .delete()
            .eq('id', id)
            .eq('is_global', true);

        if (error) {
            console.error('Error deleting global document:', error);
            throw error;
        }

        return true;
    }

    async getGlobalDocuments() {
        const supabase = getSupabase();
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('knowledge_documents')
            .select('*')
            .eq('is_global', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching global documents:', error);
            return [];
        }

        return data.map(doc => this.transformDocumentFromDB(doc));
    }

    // =====================================================
    // User List (Admin only)
    // =====================================================

    async getUsers() {
        if (!authManager.isUserAdmin()) {
            throw new Error('Apenas administradores podem listar usuários');
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return data;
    }

    async updateUserRole(userId, role) {
        if (!authManager.isUserAdmin()) {
            throw new Error('Apenas administradores podem alterar roles');
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('user_profiles')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user role:', error);
            throw error;
        }

        return data;
    }

    // =====================================================
    // Statistics
    // =====================================================

    async getStats() {
        if (!this.isConnected()) {
            const localDocs = this.getLocalKnowledgeDocuments();
            return {
                totalDocuments: localDocs.length,
                globalDocuments: 0,
                userDocuments: localDocs.length
            };
        }

        const docs = await this.getKnowledgeDocuments();
        const globalDocs = docs.filter(d => d.isGlobal);
        const userDocs = docs.filter(d => !d.isGlobal);

        return {
            totalDocuments: docs.length,
            globalDocuments: globalDocs.length,
            userDocuments: userDocs.length
        };
    }
}

// Instância global
const dataService = new DataService();

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
}
