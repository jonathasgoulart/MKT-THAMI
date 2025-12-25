// =====================================================
// Authentication Module - Supabase Auth
// =====================================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.isAdmin = false;
        this.authStateListeners = [];
    }

    // =====================================================
    // Initialization
    // =====================================================

    async initialize() {
        const supabase = getSupabase();
        if (!supabase) {
            console.warn('Supabase não configurado. Usando modo offline.');
            return null;
        }

        // Verificar sessão existente
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            this.currentUser = session.user;
            await this.loadUserProfile();
        }

        // Monitorar mudanças de autenticação
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
            } else {
                this.currentUser = null;
                this.userProfile = null;
                this.isAdmin = false;
            }

            // Notificar listeners
            this.authStateListeners.forEach(callback => {
                callback(event, this.currentUser);
            });
        });

        return this.currentUser;
    }

    // =====================================================
    // Authentication Methods
    // =====================================================

    async signUp(email, password, displayName = '') {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase não configurado');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName || email.split('@')[0]
                }
            }
        });

        if (error) throw error;

        return data;
    }

    async signIn(email, password) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase não configurado');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        this.currentUser = data.user;
        await this.loadUserProfile();

        return data;
    }

    async signOut() {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase não configurado');

        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        this.currentUser = null;
        this.userProfile = null;
        this.isAdmin = false;

        return true;
    }

    async resetPassword(email) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase não configurado');

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) throw error;

        return data;
    }

    async updatePassword(newPassword) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase não configurado');

        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        return data;
    }

    // =====================================================
    // User Profile Methods
    // =====================================================

    async loadUserProfile() {
        const supabase = getSupabase();
        if (!supabase || !this.currentUser) return null;

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .single();

        if (error) {
            console.error('Error loading user profile:', error);
            return null;
        }

        this.userProfile = data;
        this.isAdmin = data?.role === 'admin';

        return this.userProfile;
    }

    async updateUserProfile(updates) {
        const supabase = getSupabase();
        if (!supabase || !this.currentUser) throw new Error('Não autenticado');

        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', this.currentUser.id)
            .select()
            .single();

        if (error) throw error;

        this.userProfile = data;
        return data;
    }

    // =====================================================
    // Getters
    // =====================================================

    getCurrentUser() {
        return this.currentUser;
    }

    getUserProfile() {
        return this.userProfile;
    }

    getUserId() {
        return this.currentUser?.id || null;
    }

    getUserEmail() {
        return this.currentUser?.email || null;
    }

    getDisplayName() {
        return this.userProfile?.display_name ||
            this.currentUser?.email?.split('@')[0] ||
            'Usuário';
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isUserAdmin() {
        return this.isAdmin;
    }

    // =====================================================
    // Event Listeners
    // =====================================================

    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);

        // Retornar função para remover listener
        return () => {
            this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback);
        };
    }

    // =====================================================
    // Utility Methods
    // =====================================================

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    requireAdmin() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        if (!this.isUserAdmin()) {
            alert('Acesso negado. Apenas administradores podem acessar esta área.');
            window.location.href = '/';
            return false;
        }
        return true;
    }
}

// Instância global
const authManager = new AuthManager();

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
