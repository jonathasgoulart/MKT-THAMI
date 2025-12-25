-- CORREÇÃO: Políticas para permitir o trigger criar perfis
-- Execute este script no SQL Editor do Supabase

-- Remover trigger antigo e recriar com permissões corretas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar a função com SECURITY DEFINER (permissões elevadas)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Criar user_profile
    INSERT INTO public.user_profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'user'
    );
    
    -- Criar artist_profile vazio
    INSERT INTO public.artist_profiles (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Garantir que o trigger tenha permissões
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
