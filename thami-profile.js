// ===================================
// THAMI Profile Management
// ===================================

class ThamiProfile {
    constructor() {
        this.storageKey = 'thami_profile';
        this.defaultProfile = {
            bio: {
                name: 'THAMI',
                fullName: 'Thamires [Sobrenome]',
                genre: 'Pop, R&B, Soul',
                description: 'THAMI é uma artista brasileira que conquistou o público com sua voz marcante e letras profundas. Com influências que vão do pop ao R&B, ela cria músicas que tocam o coração e fazem dançar.',
                location: 'São Paulo, Brasil',
                yearsActive: '2020 - Presente'
            },
            achievements: [
                {
                    title: 'Primeiro Single',
                    description: 'Lançamento do single de estreia que alcançou 1 milhão de streams',
                    date: '2020'
                },
                {
                    title: 'Prêmio Revelação',
                    description: 'Indicada como Revelação do Ano em premiação nacional',
                    date: '2021'
                }
            ],
            events: [
                {
                    title: 'Show em São Paulo',
                    venue: 'Casa de Shows XYZ',
                    date: '2024-01-15',
                    city: 'São Paulo, SP',
                    ticketLink: ''
                }
            ],
            releases: [
                {
                    title: 'Último Single',
                    type: 'Single',
                    releaseDate: '2023-12-01',
                    description: 'Uma balada emocionante sobre amor e superação',
                    platforms: {
                        spotify: '',
                        deezer: '',
                        appleMusic: '',
                        youtube: ''
                    }
                }
            ],
            social: {
                instagram: '@thami',
                facebook: 'thamioficial',
                twitter: '@thami',
                tiktok: '@thami',
                youtube: '@thamioficial',
                website: ''
            }
        };
        
        this.profile = this.loadProfile();
    }

    loadProfile() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
        return this.defaultProfile;
    }

    saveProfile(profile) {
        try {
            this.profile = profile;
            localStorage.setItem(this.storageKey, JSON.stringify(profile));
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            return false;
        }
    }

    getProfile() {
        return this.profile;
    }

    resetToDefault() {
        this.profile = JSON.parse(JSON.stringify(this.defaultProfile));
        this.saveProfile(this.profile);
        return this.profile;
    }

    // Get formatted profile for AI context
    getFormattedContext() {
        const p = this.profile;
        let context = `# Perfil da Artista THAMI\n\n`;
        
        // Bio
        context += `## Informações Básicas\n`;
        context += `Nome: ${p.bio.name}\n`;
        context += `Nome Completo: ${p.bio.fullName}\n`;
        context += `Gênero Musical: ${p.bio.genre}\n`;
        context += `Localização: ${p.bio.location}\n`;
        context += `Anos Ativos: ${p.bio.yearsActive}\n\n`;
        context += `Descrição: ${p.bio.description}\n\n`;
        
        // Achievements
        if (p.achievements && p.achievements.length > 0) {
            context += `## Conquistas\n`;
            p.achievements.forEach(achievement => {
                context += `- ${achievement.title} (${achievement.date}): ${achievement.description}\n`;
            });
            context += '\n';
        }
        
        // Events
        if (p.events && p.events.length > 0) {
            context += `## Próximos Eventos\n`;
            p.events.forEach(event => {
                context += `- ${event.title} em ${event.venue}, ${event.city} (${event.date})\n`;
            });
            context += '\n';
        }
        
        // Releases
        if (p.releases && p.releases.length > 0) {
            context += `## Lançamentos Recentes\n`;
            p.releases.forEach(release => {
                context += `- ${release.title} (${release.type}) - ${release.releaseDate}: ${release.description}\n`;
            });
            context += '\n';
        }
        
        // Social
        context += `## Redes Sociais\n`;
        context += `Instagram: ${p.social.instagram}\n`;
        context += `Facebook: ${p.social.facebook}\n`;
        context += `Twitter: ${p.social.twitter}\n`;
        context += `TikTok: ${p.social.tiktok}\n`;
        context += `YouTube: ${p.social.youtube}\n`;
        if (p.social.website) {
            context += `Website: ${p.social.website}\n`;
        }
        
        return context;
    }

    // Render profile editor
    renderProfileEditor(activeTab = 'bio') {
        const container = document.getElementById('profile-form');
        if (!container) return;

        const p = this.profile;
        let html = '';

        switch (activeTab) {
            case 'bio':
                html = `
                    <div class="form-group">
                        <label for="profile-name">Nome Artístico</label>
                        <input type="text" id="profile-name" value="${p.bio.name}" />
                    </div>
                    <div class="form-group">
                        <label for="profile-fullname">Nome Completo</label>
                        <input type="text" id="profile-fullname" value="${p.bio.fullName}" />
                    </div>
                    <div class="form-group">
                        <label for="profile-genre">Gênero Musical</label>
                        <input type="text" id="profile-genre" value="${p.bio.genre}" />
                    </div>
                    <div class="form-group">
                        <label for="profile-description">Descrição/Biografia</label>
                        <textarea id="profile-description" rows="6">${p.bio.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="profile-location">Localização</label>
                        <input type="text" id="profile-location" value="${p.bio.location}" />
                    </div>
                    <div class="form-group">
                        <label for="profile-years">Anos Ativos</label>
                        <input type="text" id="profile-years" value="${p.bio.yearsActive}" />
                    </div>
                `;
                break;

            case 'achievements':
                html = '<div class="achievements-list">';
                p.achievements.forEach((achievement, index) => {
                    html += `
                        <div class="achievement-item" data-index="${index}">
                            <div class="form-group">
                                <label>Título</label>
                                <input type="text" class="achievement-title" value="${achievement.title}" />
                            </div>
                            <div class="form-group">
                                <label>Descrição</label>
                                <textarea class="achievement-description" rows="2">${achievement.description}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Data/Ano</label>
                                <input type="text" class="achievement-date" value="${achievement.date}" />
                            </div>
                            <button class="btn-danger remove-achievement" data-index="${index}">Remover</button>
                        </div>
                    `;
                });
                html += '</div>';
                html += '<button class="btn-secondary" id="add-achievement">+ Adicionar Conquista</button>';
                break;

            case 'events':
                html = '<div class="events-list">';
                p.events.forEach((event, index) => {
                    html += `
                        <div class="event-item" data-index="${index}">
                            <div class="form-group">
                                <label>Título do Evento</label>
                                <input type="text" class="event-title" value="${event.title}" />
                            </div>
                            <div class="form-group">
                                <label>Local</label>
                                <input type="text" class="event-venue" value="${event.venue}" />
                            </div>
                            <div class="form-group">
                                <label>Cidade</label>
                                <input type="text" class="event-city" value="${event.city}" />
                            </div>
                            <div class="form-group">
                                <label>Data</label>
                                <input type="date" class="event-date" value="${event.date}" />
                            </div>
                            <div class="form-group">
                                <label>Link para Ingressos</label>
                                <input type="url" class="event-ticket" value="${event.ticketLink}" />
                            </div>
                            <button class="btn-danger remove-event" data-index="${index}">Remover</button>
                        </div>
                    `;
                });
                html += '</div>';
                html += '<button class="btn-secondary" id="add-event">+ Adicionar Evento</button>';
                break;

            case 'releases':
                html = '<div class="releases-list">';
                p.releases.forEach((release, index) => {
                    html += `
                        <div class="release-item" data-index="${index}">
                            <div class="form-group">
                                <label>Título</label>
                                <input type="text" class="release-title" value="${release.title}" />
                            </div>
                            <div class="form-group">
                                <label>Tipo</label>
                                <select class="release-type">
                                    <option value="Single" ${release.type === 'Single' ? 'selected' : ''}>Single</option>
                                    <option value="EP" ${release.type === 'EP' ? 'selected' : ''}>EP</option>
                                    <option value="Album" ${release.type === 'Album' ? 'selected' : ''}>Álbum</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Data de Lançamento</label>
                                <input type="date" class="release-date" value="${release.releaseDate}" />
                            </div>
                            <div class="form-group">
                                <label>Descrição</label>
                                <textarea class="release-description" rows="2">${release.description}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Spotify</label>
                                <input type="url" class="release-spotify" value="${release.platforms.spotify}" />
                            </div>
                            <div class="form-group">
                                <label>Deezer</label>
                                <input type="url" class="release-deezer" value="${release.platforms.deezer}" />
                            </div>
                            <div class="form-group">
                                <label>Apple Music</label>
                                <input type="url" class="release-apple" value="${release.platforms.appleMusic}" />
                            </div>
                            <div class="form-group">
                                <label>YouTube</label>
                                <input type="url" class="release-youtube" value="${release.platforms.youtube}" />
                            </div>
                            <button class="btn-danger remove-release" data-index="${index}">Remover</button>
                        </div>
                    `;
                });
                html += '</div>';
                html += '<button class="btn-secondary" id="add-release">+ Adicionar Lançamento</button>';
                break;

            case 'social':
                html = `
                    <div class="form-group">
                        <label for="social-instagram">Instagram</label>
                        <input type="text" id="social-instagram" value="${p.social.instagram}" placeholder="@usuario" />
                    </div>
                    <div class="form-group">
                        <label for="social-facebook">Facebook</label>
                        <input type="text" id="social-facebook" value="${p.social.facebook}" placeholder="usuario" />
                    </div>
                    <div class="form-group">
                        <label for="social-twitter">Twitter/X</label>
                        <input type="text" id="social-twitter" value="${p.social.twitter}" placeholder="@usuario" />
                    </div>
                    <div class="form-group">
                        <label for="social-tiktok">TikTok</label>
                        <input type="text" id="social-tiktok" value="${p.social.tiktok}" placeholder="@usuario" />
                    </div>
                    <div class="form-group">
                        <label for="social-youtube">YouTube</label>
                        <input type="text" id="social-youtube" value="${p.social.youtube}" placeholder="@canal" />
                    </div>
                    <div class="form-group">
                        <label for="social-website">Website</label>
                        <input type="url" id="social-website" value="${p.social.website}" placeholder="https://..." />
                    </div>
                `;
                break;
        }

        container.innerHTML = html;
        this.attachEditorEventListeners(activeTab);
    }

    attachEditorEventListeners(activeTab) {
        // Add/Remove buttons for dynamic lists
        if (activeTab === 'achievements') {
            document.getElementById('add-achievement')?.addEventListener('click', () => {
                this.profile.achievements.push({
                    title: 'Nova Conquista',
                    description: '',
                    date: new Date().getFullYear().toString()
                });
                this.renderProfileEditor('achievements');
            });

            document.querySelectorAll('.remove-achievement').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.profile.achievements.splice(index, 1);
                    this.renderProfileEditor('achievements');
                });
            });
        }

        if (activeTab === 'events') {
            document.getElementById('add-event')?.addEventListener('click', () => {
                this.profile.events.push({
                    title: 'Novo Evento',
                    venue: '',
                    date: '',
                    city: '',
                    ticketLink: ''
                });
                this.renderProfileEditor('events');
            });

            document.querySelectorAll('.remove-event').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.profile.events.splice(index, 1);
                    this.renderProfileEditor('events');
                });
            });
        }

        if (activeTab === 'releases') {
            document.getElementById('add-release')?.addEventListener('click', () => {
                this.profile.releases.push({
                    title: 'Novo Lançamento',
                    type: 'Single',
                    releaseDate: '',
                    description: '',
                    platforms: {
                        spotify: '',
                        deezer: '',
                        appleMusic: '',
                        youtube: ''
                    }
                });
                this.renderProfileEditor('releases');
            });

            document.querySelectorAll('.remove-release').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.profile.releases.splice(index, 1);
                    this.renderProfileEditor('releases');
                });
            });
        }
    }

    // Collect data from editor form
    collectFormData(activeTab) {
        const p = this.profile;

        switch (activeTab) {
            case 'bio':
                p.bio.name = document.getElementById('profile-name').value;
                p.bio.fullName = document.getElementById('profile-fullname').value;
                p.bio.genre = document.getElementById('profile-genre').value;
                p.bio.description = document.getElementById('profile-description').value;
                p.bio.location = document.getElementById('profile-location').value;
                p.bio.yearsActive = document.getElementById('profile-years').value;
                break;

            case 'achievements':
                p.achievements = [];
                document.querySelectorAll('.achievement-item').forEach(item => {
                    p.achievements.push({
                        title: item.querySelector('.achievement-title').value,
                        description: item.querySelector('.achievement-description').value,
                        date: item.querySelector('.achievement-date').value
                    });
                });
                break;

            case 'events':
                p.events = [];
                document.querySelectorAll('.event-item').forEach(item => {
                    p.events.push({
                        title: item.querySelector('.event-title').value,
                        venue: item.querySelector('.event-venue').value,
                        city: item.querySelector('.event-city').value,
                        date: item.querySelector('.event-date').value,
                        ticketLink: item.querySelector('.event-ticket').value
                    });
                });
                break;

            case 'releases':
                p.releases = [];
                document.querySelectorAll('.release-item').forEach(item => {
                    p.releases.push({
                        title: item.querySelector('.release-title').value,
                        type: item.querySelector('.release-type').value,
                        releaseDate: item.querySelector('.release-date').value,
                        description: item.querySelector('.release-description').value,
                        platforms: {
                            spotify: item.querySelector('.release-spotify').value,
                            deezer: item.querySelector('.release-deezer').value,
                            appleMusic: item.querySelector('.release-apple').value,
                            youtube: item.querySelector('.release-youtube').value
                        }
                    });
                });
                break;

            case 'social':
                p.social.instagram = document.getElementById('social-instagram').value;
                p.social.facebook = document.getElementById('social-facebook').value;
                p.social.twitter = document.getElementById('social-twitter').value;
                p.social.tiktok = document.getElementById('social-tiktok').value;
                p.social.youtube = document.getElementById('social-youtube').value;
                p.social.website = document.getElementById('social-website').value;
                break;
        }

        return p;
    }

    // Render profile preview for sidebar
    renderProfilePreview() {
        const container = document.getElementById('profile-preview-content');
        if (!container) return;

        const p = this.profile;
        let html = `
            <div style="margin-bottom: 1rem;">
                <strong>${p.bio.name}</strong><br>
                <small style="color: var(--text-tertiary);">${p.bio.genre}</small>
            </div>
            <p style="font-size: 0.8rem; line-height: 1.5; margin-bottom: 1rem;">
                ${p.bio.description.substring(0, 150)}${p.bio.description.length > 150 ? '...' : ''}
            </p>
        `;

        if (p.achievements.length > 0) {
            html += `<div style="margin-bottom: 0.5rem;"><strong>Conquistas:</strong> ${p.achievements.length}</div>`;
        }
        if (p.events.length > 0) {
            html += `<div style="margin-bottom: 0.5rem;"><strong>Próximos Eventos:</strong> ${p.events.length}</div>`;
        }
        if (p.releases.length > 0) {
            html += `<div style="margin-bottom: 0.5rem;"><strong>Lançamentos:</strong> ${p.releases.length}</div>`;
        }

        container.innerHTML = html;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThamiProfile;
}
