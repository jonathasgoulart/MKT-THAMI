# 🚀 Guia de Configuração - THAMI Marketing SaaS

Este guia irá ajudá-lo a configurar o Supabase para transformar o THAMI Marketing Assistant em uma aplicação multi-usuário.

---

## Passo 1: Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"**
3. Faça login com GitHub ou email
4. Clique em **"New Project"**
5. Preencha:
   - **Organization**: Escolha ou crie uma organização
   - **Name**: `thami-marketing` (ou o nome que preferir)
   - **Database Password**: Gere uma senha segura (anote-a!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
6. Clique em **"Create new project"**
7. Aguarde ~2 minutos para o projeto ser criado

---

## Passo 2: Executar o Schema SQL

1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo `supabase-schema.sql` do seu projeto
4. Cole no editor SQL
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Você verá uma mensagem "Success. No rows returned" - isso é normal!

---

## Passo 3: Obter as Credenciais

1. No menu lateral, clique em **"Project Settings"** (ícone de engrenagem)
2. Clique em **"API"** no submenu
3. Você verá dois valores importantes:

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
Copie este valor.

### Anon/Public Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Copie este valor (é uma string longa que começa com `eyJ`).

---

## Passo 4: Configurar o Projeto

### Opção A: Configuração Local (para testar)

1. Abra o arquivo `supabase.js` no seu projeto
2. Substitua os valores:

```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co';  // ← Cole sua URL aqui
const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...';  // ← Cole sua key aqui
```

### Opção B: Configuração no Vercel (para produção)

1. Acesse [vercel.com](https://vercel.com) e vá ao seu projeto
2. Clique em **"Settings"** → **"Environment Variables"**
3. Adicione duas variáveis:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sua Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua Anon Key |

4. Clique em **"Save"**
5. Faça um novo deploy

---

## Passo 5: Criar seu Usuário Admin

1. Acesse a página de login: `seusite.vercel.app/login`
2. Crie uma conta com seu email
3. No Supabase, vá em **"Table Editor"**
4. Clique na tabela `user_profiles`
5. Encontre seu usuário e clique para editar
6. Mude o campo `role` de `user` para `admin`
7. Clique em **"Save"**

Pronto! Agora você é admin e pode acessar o painel em `/admin`.

---

## Passo 6: Testar

1. **Login**: Acesse `/login` e faça login com sua conta
2. **Painel Admin**: Acesse `/admin` e crie documentos globais
3. **App Principal**: Verifique se seu nome aparece no header
4. **Criar Briefing**: Adicione um briefing e verifique se foi salvo
5. **Novo Usuário**: Crie outra conta para testar o isolamento de dados

---

## 🔧 Solução de Problemas

### "Supabase não configurado"
- Verifique se editou o arquivo `supabase.js` com as credenciais corretas
- Verifique se a URL começa com `https://` e termina com `.supabase.co`

### Erro ao fazer login
- Verifique se executou o schema SQL corretamente
- Verifique se a Anon Key está correta (começa com `eyJ`)

### Admin não aparece
- Verifique se alterou o `role` para `admin` no banco de dados
- Faça logout e login novamente

### Dados não salvam
- Verifique se as políticas RLS foram criadas (no SQL Editor, rode o schema novamente)
- Verifique o console do navegador para erros

---

## 📧 Próximos Passos

Após configurar o Supabase:

1. **Configure o email de confirmação** (opcional):
   - Supabase → Authentication → Email Templates
   - Personalize os templates em português

2. **Adicione documentos globais**:
   - Acesse `/admin`
   - Crie estratégias de marketing que todos verão

3. **Convide usuários**:
   - Compartilhe o link do app
   - Cada pessoa cria sua conta e tem seu próprio espaço

---

**Precisa de ajuda?** Volte aqui e me pergunte! 🎵
