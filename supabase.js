// =====================================================
// Supabase Client Configuration
// =====================================================

const SUPABASE_URL = 'https://vpqnavcsjuaijvlqihyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcW5hdmNzanVhaWp2bHFpaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjcxOTUsImV4cCI6MjA4MjI0MzE5NX0.qK7slXgmnW_zmFUawpKt4tq6Y_5bpXdJeaxtRjg6hnw';

// Verificar se as credenciais foram configuradas
function checkSupabaseConfig() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('⚠️ Supabase não configurado! Edite o arquivo supabase.js com suas credenciais.');
        return false;
    }
    return true;
}

// Criar cliente Supabase
let supabaseClient = null;

function getSupabase() {
    if (!checkSupabaseConfig()) {
        return null;
    }

    if (!supabaseClient) {
        // Usar o SDK do Supabase carregado via CDN
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error('Supabase SDK não carregado. Verifique se o script foi incluído no HTML.');
            return null;
        }
    }

    return supabaseClient;
}

// =====================================================
// Helper Functions
// =====================================================

// Verificar se está configurado
function isSupabaseConfigured() {
    return checkSupabaseConfig();
}

// Obter URL do Supabase
function getSupabaseUrl() {
    return SUPABASE_URL;
}

// Export para uso global
window.getSupabase = getSupabase;
window.isSupabaseConfigured = isSupabaseConfigured;
window.getSupabaseUrl = getSupabaseUrl;
