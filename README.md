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

### 1. Abrir a Aplicação
Abra o arquivo `index.html` no seu navegador:
```
file:///C:/Users/jonat/Documents/Mkt musical/index.html
```

### 2. Configurar API Key
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie ou copie sua API Key do Gemini
3. Na aplicação, clique em ⚙️ (Configurações)
4. Cole e salve sua API Key

### 3. Atualizar Perfil da THAMI
1. Clique em "Perfil"
2. Preencha todas as abas com informações da artista
3. Adicione conquistas, eventos e lançamentos
4. Salve as alterações

### 4. Gerar Conteúdo
1. No Dashboard, clique no tipo de conteúdo desejado
2. Preencha o tema e detalhes
3. Escolha o tom de voz
4. Clique em "Gerar Conteúdo"
5. Edite, copie ou salve o resultado

## 📁 Estrutura do Projeto

```
Mkt musical/
├── index.html              # Estrutura principal da aplicação
├── styles.css              # Design system e estilos
├── app.js                  # Controlador principal
├── thami-profile.js        # Gerenciamento de perfil
├── ai-generator.js         # Integração com Gemini AI
├── content-manager.js      # Biblioteca de conteúdo
└── README.md              # Este arquivo
```

## 🛠️ Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Design moderno com variáveis CSS
- **Vanilla JavaScript** - Sem dependências externas
- **Google Gemini API** - IA para geração de conteúdo
- **LocalStorage** - Persistência de dados no navegador

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

## 🔒 Privacidade

- ✅ Todos os dados são armazenados **localmente** no navegador
- ✅ Nenhuma informação é enviada para servidores externos
- ✅ A API Key fica apenas no seu navegador
- ✅ Você controla seus dados completamente

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

### Conteúdo não está sendo gerado
- Verifique se a API Key está configurada corretamente
- Confirme sua conexão com a internet
- Verifique se preencheu o campo "Tema ou Assunto"

### API Key inválida
- Obtenha uma nova chave em [Google AI Studio](https://makersuite.google.com/app/apikey)
- Certifique-se de copiar a chave completa
- Salve novamente nas configurações

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
