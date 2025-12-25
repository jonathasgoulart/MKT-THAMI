-- THAMI Marketing Assistant - Supabase Database Schema
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABELA: user_profiles (dados extras do usuário)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: artist_profiles (perfil do artista)
CREATE TABLE IF NOT EXISTS artist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bio JSONB DEFAULT '{
        "name": "",
        "fullName": "",
        "genre": "",
        "description": "",
        "location": "",
        "yearsActive": ""
    }'::jsonb,
    achievements JSONB DEFAULT '[]'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    releases JSONB DEFAULT '[]'::jsonb,
    social JSONB DEFAULT '{
        "instagram": "",
        "facebook": "",
        "twitter": "",
        "tiktok": "",
        "youtube": "",
        "website": ""
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- TABELA: knowledge_documents (base de conhecimento)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON knowledge_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_is_global ON knowledge_documents(is_global);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_documents(category);

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: user_profiles
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- POLÍTICAS: artist_profiles
CREATE POLICY "Users can view own artist profile"
    ON artist_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own artist profile"
    ON artist_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own artist profile"
    ON artist_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own artist profile"
    ON artist_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- POLÍTICAS: knowledge_documents
CREATE POLICY "Users can view own or global documents"
    ON knowledge_documents FOR SELECT
    USING (
        auth.uid() = user_id 
        OR is_global = TRUE
    );

CREATE POLICY "Users can insert own documents"
    ON knowledge_documents FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND is_global = FALSE
    );

CREATE POLICY "Users can update own documents"
    ON knowledge_documents FOR UPDATE
    USING (
        auth.uid() = user_id 
        AND is_global = FALSE
    );

CREATE POLICY "Users can delete own documents"
    ON knowledge_documents FOR DELETE
    USING (
        auth.uid() = user_id 
        AND is_global = FALSE
    );

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins podem inserir documentos globais
CREATE POLICY "Admins can insert global documents"
    ON knowledge_documents FOR INSERT
    WITH CHECK (
        is_global = TRUE AND is_admin()
    );

-- Admins podem atualizar documentos globais
CREATE POLICY "Admins can update global documents"
    ON knowledge_documents FOR UPDATE
    USING (
        is_global = TRUE AND is_admin()
    );

-- Admins podem deletar documentos globais
CREATE POLICY "Admins can delete global documents"
    ON knowledge_documents FOR DELETE
    USING (
        is_global = TRUE AND is_admin()
    );

-- TRIGGER: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artist_profiles_updated_at
    BEFORE UPDATE ON artist_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_documents_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER: Criar perfil do usuário automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    
    INSERT INTO artist_profiles (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
