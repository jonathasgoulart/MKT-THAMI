# 🎵 THAMI Marketing Assistant

Uma aplicação web moderna e completa para geração de conteúdo de marketing usando IA para a artista THAMI.

![Dashboard](https://img.shields.io/badge/Status-Pronto-success?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Funcionalidades

### 🤖 Geração de Conteúdo com IA
Gere conteúdo personalizado para 6 plataformas diferentes:
- 📸 **Instagram** - Posts visuais com hashtags e emojis
- 👍 **Facebook** - Posts engajadores com storytelling
- 🐦 **Twitter/X** - Tweets impactantes (280 caracteres)
- 🎬 **TikTok** - Legendas criativas e energéticas
- ✉️ **Email** - Newsletters e comunicados profissionais
- 📰 **Press Release** - Comunicados à imprensa formatados

### 👤 Gerenciamento de Perfil
Mantenha todas as informações da artista organizadas:
- Biografia completa
- Conquistas e prêmios
- Eventos e shows
- Lançamentos musicais
- Links de redes sociais

### 📚 Biblioteca de Conteúdo
- Salve conteúdos gerados
- Busca e filtros avançados
- Copie rapidamente para usar
- Exporte e importe dados

### ⚙️ Configurações
- API Key do Google Gemini
- Backup e restauração de dados
- Gerenciamento de armazenamento local

## 🎨 Design Premium

- 🌙 **Dark Mode** elegante com gradientes roxo/rosa
- ✨ **Glassmorphism** para efeitos modernos
- 🎭 **Animações suaves** e micro-interações
- 📱 **Totalmente responsivo** para todos os dispositivos

## 🚀 Como Usar

A aplicação agora utiliza um **Proxy Seguro**, o que significa que o usuário final não precisa configurar suas próprias chaves de API. As chaves são gerenciadas centralmente no servidor (Vercel).

### 1. Configuração para o Administrador (Deploy)
Se você estiver fazendo o deploy da aplicação:
1. No painel do Vercel, adicione as seguintes variáveis de ambiente:
   - `GROQ_API_KEY`: Sua chave do Groq.
   - `GEMINI_API_KEY`: Sua chave do Gemini.
2. A aplicação detectará automaticamente as chaves através do endpoint `/api/chat`.

### 2. Atualizar Perfil da THAMI
1. Clique em "Perfil".
2. Preencha todas as abas com informações da artista.
3. Salve as alterações.

### 3. Gerar Conteúdo
1. No Dashboard (Chat), selecione a plataforma desejada.
2. Converse com o assistente ou use os "Quick Actions".
3. O assistente usará o contexto do perfil e dos briefings para criar o conteúdo.

## 📁 Estrutura do Projeto

```
Mkt musical/
├── api/
│   └── chat.js             # Proxy Seguro (Vercel Function)
├── index.html              # Estrutura principal da aplicação
├── styles.css              # Design system e estilos
├── app.js                  # Controlador principal
├── thami-profile.js        # Gerenciamento de perfil
├── ai-generator.js         # Integração com IAs via Proxy
├── chat-assistant.js       # Lógica do assistente de chat
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias

- **HTML5 / CSS3** - Interface moderna e responsiva.
- **Vanilla JavaScript** - Lógica do frontend sem frameworks pesados.
- **Vercel Functions (Node.js)** - Proxy seguro para proteger as chaves de API.
- **Groq & Gemini** - Modelos de IA de última geração.
- **Supabase** - Autenticação e persistência de dados em nuvem.

## 💡 Dicas para Melhores Resultados

### Perfil Completo
Quanto mais informações você adicionar ao perfil, mais personalizado será o conteúdo gerado.

### Seja Específico
No tema, seja claro e detalhado:
- ✅ "Lançamento do novo single 'Amor Infinito' que fala sobre superação"
- ❌ "Novo single"

### Escolha o Tom Certo
- **Profissional**: Press releases, emails formais
- **Casual**: Instagram, Facebook para fãs
- **Energético**: TikTok, anúncios de shows
- **Emocional**: Lançamentos especiais
- **Inspirador**: Mensagens motivacionais

### Edite e Personalize
O conteúdo gerado é uma excelente base, mas sempre revise antes de publicar!

## 🔒 Segurança e Privacidade

- **Chaves Protegidas**: As API Keys **nunca** são expostas no navegador. Todas as requisições passam por um proxy no backend.
- **Dados do Artista**: As informações de perfil podem ser salvas localmente ou sincronizadas de forma segura via Supabase.
- **Sem Exposição**: Ao contrário da versão anterior, ninguém pode "roubar" sua chave inspecionando o código da página.

## 📊 Tipos de Conteúdo

| Plataforma | Tom | Limite | Características |
|------------|-----|--------|-----------------|
| Instagram | Autêntico | 2.200 chars | Hashtags, emojis, visual |
| Facebook | Envolvente | 5.000 chars | Storytelling, parágrafos curtos |
| Twitter/X | Direto | 280 chars | Conciso, impactante |
| TikTok | Energético | 2.200 chars | Criativo, trends |
| Email | Profissional | 10.000 chars | Estruturado, call-to-action |
| Press Release | Formal | 15.000 chars | Jornalístico, terceira pessoa |

## 🎯 Casos de Uso

### Lançamento de Single
1. Atualize o perfil com o novo lançamento
2. Gere posts para Instagram, Facebook e Twitter
3. Crie um email para fãs
4. Prepare um press release para a imprensa

### Anúncio de Show
1. Adicione o evento no perfil
2. Gere posts energéticos para TikTok e Instagram
3. Crie email com informações de ingressos
4. Prepare conteúdo para Facebook com detalhes

### Conquista ou Prêmio
1. Adicione a conquista no perfil
2. Gere posts inspiradores para todas as plataformas
3. Crie press release profissional
4. Prepare email comemorativo para fãs

## 🔄 Backup e Restauração

### Exportar Dados
1. Vá em Configurações
2. Clique em "Exportar Dados"
3. Salve o arquivo JSON em local seguro

### Importar Dados
1. Vá em Configurações
2. Clique em "Importar Dados"
3. Selecione o arquivo JSON exportado anteriormente

## 🐛 Solução de Problemas

### Erro de Conexão com IA
- Verifique se as variáveis `GROQ_API_KEY` ou `GEMINI_API_KEY` estão configuradas corretamente no Vercel.
- Verifique se o deploy das Serverless Functions foi concluído com sucesso.

### Dados não estão salvando
- Verifique se o navegador permite LocalStorage
- Tente em modo normal (não anônimo/privado)
- Limpe o cache e tente novamente

## 🚀 Melhorias Futuras

Possíveis funcionalidades para versões futuras:
- [ ] Integração direta com APIs de redes sociais
- [ ] Agendamento de posts
- [ ] Análise de performance
- [ ] Templates personalizados
- [ ] Suporte a múltiplos artistas
- [ ] Modo claro (light mode)
- [ ] Geração de imagens com IA
- [ ] Sugestões de hashtags trending

## 📝 Licença

Este projeto é de uso livre para a artista THAMI e sua equipe de marketing.

## 🤝 Suporte

Para dúvidas ou sugestões sobre a aplicação, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para THAMI**

*Transforme suas ideias em conteúdo incrível com o poder da IA!* ✨
