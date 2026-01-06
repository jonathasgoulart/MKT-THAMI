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

    // Stores the current active artist ID
    activeArtistId = null;

    async getArtistProfile(artistId = null) {
        if (!this.isConnected()) {
            return this.getLocalProfile();
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        // If artistId provided, use it; otherwise get active artist
        let targetArtistId = artistId || this.activeArtistId;

        if (!targetArtistId) {
            // Get active artist
            const { data: activeArtist } = await supabase
                .from('artist_profiles')
                .select('id')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            targetArtistId = activeArtist?.id;

            // If still no active, get the first one
            if (!targetArtistId) {
                const { data: firstArtist } = await supabase
                    .from('artist_profiles')
                    .select('id')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .single();

                targetArtistId = firstArtist?.id;
            }
        }

        if (!targetArtistId) {
            console.error('No artist found for user');
            return this.getLocalProfile();
        }

        // Store for future use
        this.activeArtistId = targetArtistId;

        const { data, error } = await supabase
            .from('artist_profiles')
            .select('*')
            .eq('id', targetArtistId)
            .single();

        if (error) {
            console.error('Error fetching artist profile:', error);
            return this.getLocalProfile();
        }

        // Also return the artist ID for reference
        const profile = this.transformProfileFromDB(data);
        profile._artistId = data.id;
        return profile;
    }

    async saveArtistProfile(profile, artistId = null) {
        if (!this.isConnected()) {
            return this.saveLocalProfile(profile);
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();
        const targetArtistId = artistId || this.activeArtistId || profile._artistId;

        const dbProfile = this.transformProfileToDB(profile);

        if (targetArtistId) {
            // Update existing artist
            const { data, error } = await supabase
                .from('artist_profiles')
                .update(dbProfile)
                .eq('id', targetArtistId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error saving artist profile:', error);
                throw error;
            }

            return this.transformProfileFromDB(data);
        } else {
            // Fallback: create new artist (shouldn't happen normally)
            const { data, error } = await supabase
                .from('artist_profiles')
                .insert({
                    user_id: userId,
                    ...dbProfile,
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating artist profile:', error);
                throw error;
            }

            this.activeArtistId = data.id;
            return this.transformProfileFromDB(data);
        }
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

    // =====================================================
    // Multi-Artist Management
    // =====================================================

    // Get all artists for the current user
    async getArtists() {
        if (!this.isConnected()) {
            return this.getLocalArtists();
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        const { data, error } = await supabase
            .from('artist_profiles')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching artists:', error);
            return this.getLocalArtists();
        }

        return data.map(artist => ({
            id: artist.id,
            name: artist.bio?.name || 'Artista sem nome',
            genre: artist.bio?.genre || '',
            isActive: artist.is_active || false,
            bio: artist.bio,
            achievements: artist.achievements,
            events: artist.events,
            releases: artist.releases,
            social: artist.social,
            createdAt: artist.created_at
        }));
    }

    // Get the active artist
    async getActiveArtist() {
        if (!this.isConnected()) {
            return this.getLocalActiveArtist();
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        // Try to get active artist first
        let { data, error } = await supabase
            .from('artist_profiles')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        // If no active artist, get the first one
        if (error || !data) {
            const { data: firstArtist } = await supabase
                .from('artist_profiles')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true })
                .limit(1)
                .single();

            if (firstArtist) {
                // Set it as active
                await this.setActiveArtist(firstArtist.id);
                data = firstArtist;
            }
        }

        if (!data) return null;

        return {
            id: data.id,
            name: data.bio?.name || 'Artista sem nome',
            genre: data.bio?.genre || '',
            isActive: true,
            bio: data.bio,
            achievements: data.achievements,
            events: data.events,
            releases: data.releases,
            social: data.social
        };
    }

    // Set an artist as active
    async setActiveArtist(artistId) {
        if (!this.isConnected()) {
            return this.setLocalActiveArtist(artistId);
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        // Deactivate all artists first
        await supabase
            .from('artist_profiles')
            .update({ is_active: false })
            .eq('user_id', userId);

        // Activate the selected one
        const { data, error } = await supabase
            .from('artist_profiles')
            .update({ is_active: true })
            .eq('id', artistId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error setting active artist:', error);
            throw error;
        }

        return data;
    }

    // Create a new artist
    async createArtist(name, genre = '') {
        if (!this.isConnected()) {
            return this.createLocalArtist(name, genre);
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        // Check artist limit (max 10)
        const artists = await this.getArtists();
        if (artists.length >= 10) {
            throw new Error('Limite máximo de 10 artistas atingido');
        }

        const { data, error } = await supabase
            .from('artist_profiles')
            .insert({
                user_id: userId,
                bio: {
                    name: name.trim(),
                    fullName: '',
                    genre: genre.trim(),
                    description: '',
                    location: '',
                    yearsActive: ''
                },
                achievements: [],
                events: [],
                releases: [],
                social: {
                    instagram: '',
                    facebook: '',
                    twitter: '',
                    tiktok: '',
                    youtube: '',
                    website: ''
                },
                is_active: artists.length === 0 // First artist is active by default
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating artist:', error);
            throw error;
        }

        return {
            id: data.id,
            name: data.bio?.name || name,
            genre: data.bio?.genre || genre,
            isActive: data.is_active
        };
    }

    // Delete an artist
    async deleteArtist(artistId) {
        if (!this.isConnected()) {
            return this.deleteLocalArtist(artistId);
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();

        // Don't allow deleting the last artist
        const artists = await this.getArtists();
        if (artists.length <= 1) {
            throw new Error('Você deve ter pelo menos um artista');
        }

        const artistToDelete = artists.find(a => a.id === artistId);
        const wasActive = artistToDelete?.isActive;

        const { error } = await supabase
            .from('artist_profiles')
            .delete()
            .eq('id', artistId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting artist:', error);
            throw error;
        }

        // If we deleted the active artist, activate another one
        if (wasActive) {
            const remainingArtists = artists.filter(a => a.id !== artistId);
            if (remainingArtists.length > 0) {
                await this.setActiveArtist(remainingArtists[0].id);
            }
        }

        return true;
    }

    // Local storage fallback for multi-artist
    getLocalArtists() {
        try {
            return JSON.parse(localStorage.getItem('artists_list')) || [];
        } catch {
            return [];
        }
    }

    getLocalActiveArtist() {
        const artists = this.getLocalArtists();
        return artists.find(a => a.isActive) || artists[0] || null;
    }

    setLocalActiveArtist(artistId) {
        let artists = this.getLocalArtists();
        artists = artists.map(a => ({ ...a, isActive: a.id === artistId }));
        localStorage.setItem('artists_list', JSON.stringify(artists));
        return artists.find(a => a.id === artistId);
    }

    createLocalArtist(name, genre = '') {
        const artists = this.getLocalArtists();
        if (artists.length >= 10) {
            throw new Error('Limite máximo de 10 artistas atingido');
        }
        const artist = {
            id: Date.now().toString(),
            name: name.trim(),
            genre: genre.trim(),
            isActive: artists.length === 0,
            bio: { name: name.trim(), genre: genre.trim() },
            createdAt: new Date().toISOString()
        };
        artists.push(artist);
        localStorage.setItem('artists_list', JSON.stringify(artists));
        return artist;
    }

    deleteLocalArtist(artistId) {
        let artists = this.getLocalArtists();
        if (artists.length <= 1) {
            throw new Error('Você deve ter pelo menos um artista');
        }
        const wasActive = artists.find(a => a.id === artistId)?.isActive;
        artists = artists.filter(a => a.id !== artistId);
        if (wasActive && artists.length > 0) {
            artists[0].isActive = true;
        }
        localStorage.setItem('artists_list', JSON.stringify(artists));
        return true;
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

    async getKnowledgeDocuments(artistId = null, includeGlobal = false) {
        if (!this.isConnected()) {
            return this.getLocalKnowledgeDocuments(artistId);
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();
        const targetArtistId = artistId || this.activeArtistId;

        // Check if user is admin - admins see global docs in their list
        const isAdmin = authManager.isUserAdmin();

        // Build query
        let query = supabase
            .from('knowledge_documents')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter logic:
        // - Regular users: only their own artist-specific documents (NO global docs in list)
        // - Admins or includeGlobal=true: include global documents
        if (targetArtistId) {
            if (isAdmin || includeGlobal) {
                // Admin or AI context: include global docs
                query = query.or(`and(user_id.eq.${userId},artist_id.eq.${targetArtistId}),is_global.eq.true,and(user_id.eq.${userId},artist_id.is.null)`);
            } else {
                // Regular user: only their artist-specific docs (NO global)
                query = query.or(`and(user_id.eq.${userId},artist_id.eq.${targetArtistId}),and(user_id.eq.${userId},artist_id.is.null)`);
            }
        } else {
            if (isAdmin || includeGlobal) {
                query = query.or(`user_id.eq.${userId},is_global.eq.true`);
            } else {
                query = query.eq('user_id', userId).eq('is_global', false);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching knowledge documents:', error);
            return this.getLocalKnowledgeDocuments(artistId);
        }

        return data.map(doc => this.transformDocumentFromDB(doc));
    }

    async addKnowledgeDocument(title, category, content, artistId = null) {
        if (!this.isConnected()) {
            return this.addLocalKnowledgeDocument(title, category, content, artistId);
        }

        const supabase = getSupabase();
        const userId = authManager.getUserId();
        const targetArtistId = artistId || this.activeArtistId;

        const { data, error } = await supabase
            .from('knowledge_documents')
            .insert({
                user_id: userId,
                artist_id: targetArtistId,
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
            artistId: dbDoc.artist_id,
            createdAt: dbDoc.created_at,
            updatedAt: dbDoc.updated_at
        };
    }

    // Local storage fallback for knowledge documents
    getLocalKnowledgeDocuments(artistId = null) {
        try {
            const docs = JSON.parse(localStorage.getItem('knowledge_base')) || [];
            if (artistId) {
                // Filter by artist or include docs without artistId (legacy)
                return docs.filter(d => d.artistId === artistId || !d.artistId);
            }
            return docs;
        } catch {
            return [];
        }
    }

    addLocalKnowledgeDocument(title, category, content, artistId = null) {
        const docs = this.getLocalKnowledgeDocuments();
        const doc = {
            id: Date.now().toString(),
            title: title.trim(),
            category,
            content: content.trim(),
            artistId: artistId || this.activeArtistId,
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
