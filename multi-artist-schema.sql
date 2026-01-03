-- =============================================
-- Multi-Artist Feature - Database Updates
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Remover constraint de unicidade para permitir múltiplos artistas
ALTER TABLE artist_profiles DROP CONSTRAINT IF EXISTS artist_profiles_user_id_key;

-- 2. Adicionar campo is_active para saber qual artista está selecionado
ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- 3. Adicionar campo artist_id em knowledge_documents para vincular briefings a artistas
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_artist_profiles_user_id ON artist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_active ON artist_profiles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_artist_id ON knowledge_documents(artist_id);

-- 5. Função para garantir que apenas um artista esteja ativo por usuário
CREATE OR REPLACE FUNCTION ensure_single_active_artist()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = TRUE THEN
        -- Desativar todos os outros artistas do mesmo usuário
        UPDATE artist_profiles 
        SET is_active = FALSE 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para executar a função
DROP TRIGGER IF EXISTS trigger_single_active_artist ON artist_profiles;
CREATE TRIGGER trigger_single_active_artist
    BEFORE UPDATE ON artist_profiles
    FOR EACH ROW
    WHEN (NEW.is_active = TRUE)
    EXECUTE FUNCTION ensure_single_active_artist();

-- 7. Ativar o primeiro artista de cada usuário existente
UPDATE artist_profiles ap
SET is_active = TRUE
WHERE id = (
    SELECT id FROM artist_profiles 
    WHERE user_id = ap.user_id 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- 8. Atualizar políticas RLS para knowledge_documents considerar artist_id
-- (Documentos podem ter artist_id NULL para documentos globais ou sem artista específico)

-- Verificação: listar artistas após alterações
SELECT 
    ap.id,
    ap.user_id,
    up.email,
    ap.bio->>'name' as artist_name,
    ap.is_active,
    ap.created_at
FROM artist_profiles ap
JOIN user_profiles up ON ap.user_id = up.id
ORDER BY up.email, ap.created_at;
