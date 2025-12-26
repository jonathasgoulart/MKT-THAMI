-- =====================================================
-- Chat Memory - Tabela para memória persistente do chat
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- TABELA: chat_memory (memória do assistente)
CREATE TABLE IF NOT EXISTS chat_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insights JSONB DEFAULT '[]'::jsonb,
    learned_facts JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_chat_memory_user_id ON chat_memory(user_id);

-- Habilitar RLS
ALTER TABLE chat_memory ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: chat_memory
CREATE POLICY "Users can view own memory"
    ON chat_memory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory"
    ON chat_memory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory"
    ON chat_memory FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory"
    ON chat_memory FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_chat_memory_updated_at
    BEFORE UPDATE ON chat_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar memória automaticamente para novos usuários
-- (Adicionar ao trigger existente handle_new_user ou executar separadamente)

-- Se quiser criar memória para usuários existentes:
-- INSERT INTO chat_memory (user_id)
-- SELECT id FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM chat_memory);
