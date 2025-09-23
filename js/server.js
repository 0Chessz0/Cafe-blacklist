class ServerManager {
    constructor() {
        this.servers = {};
        this.currentServer = null;
        this.users = [];
        this.filteredUsers = [];
        this.searchQuery = '';
        this.statusFilter = '';
        this.moderatorFilter = '';
        
        this.init();
    }
    
    async init() {
        await this.loadServers();
        
        if (window.location.pathname.includes('server.html')) {
            await this.initServerPage();
        } else {
            this.initLandingPage();
        }
    }
    
    async loadServers() {
        try {
            const response = await fetch(`data/servers.json?cacheBust=${Date.now()}`);
            this.servers = await response.json();
        } catch (error) {
            console.error('Failed to load servers:', error);
            this.showToast('Failed to load server data', 'error');
        }
    }
    
    initLandingPage() {
        this.renderServerCards();
    }
    
    async initServerPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const serverName = urlParams.get('name');
        
        if (!serverName || !this.servers[serverName]) {
            this.showToast('Server not found', 'error');
            window.location.href = './index.html';
            return;
        }
        
        this.currentServer = this.servers[serverName];
        await this.loadServerData(serverName);
        this.renderServerHeader();
        this.renderUsers();
        this.setupSearchAndFilters();
    }
    
    renderServerCards() {
        const serverGrid = document.getElementById('server-grid');
        if (!serverGrid) return;
        
        serverGrid.innerHTML = '';
        
        Object.entries(this.servers).forEach(([serverKey, server], index) => {
            const card = this.createServerCard(serverKey, server, index);
            serverGrid.appendChild(card);
        });
    }
    
    createServerCard(serverKey, server, index) {
        const card = document.createElement('div');

        card.className = `server-card glass`;
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.color = server.accent;
        card.setAttribute('data-testid', `card-server-${serverKey}`);
        
        card.innerHTML = `
            <div class="server-icon" style="color: ${server.accent}">
                ${server.emoji || '🌐'}
            </div>
            <h3 class="server-name">${this.escapeHtml(server.name)}</h3>
            <p class="server-description">${server.description || ''}</p>
            <div class="server-meta">
                <span>Creator: ${this.escapeHtml(server.creator)}</span>
                <span>•</span>
                <span>${server.users.length} Listed User${server.users.length !== 1 ? 's' : ''}</span>
            </div>
            <button class="server-button" style="border-color: ${server.accent}">
                View Blacklist
            </button>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `./server.html?name=${serverKey}`;
        });
        
        return card;
    }
    
    async loadServerData(serverName) {
    this.users = [];
    const server = this.servers[serverName];

    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) pageTitleEl.textContent = `${server.name} - Blacklist`;

    const userPromises = server.users.map(async (username) => {
        try {
            const response = await fetch(`data/${serverName}/${username}/user.json?cacheBust=${Date.now()}`);
            const userData = await response.json();

            userData.pfp = `data/${serverName}/${username}/pfp.png`;

            if (Array.isArray(userData.proof)) {
                userData.proof = userData.proof.map((file) => `data/${serverName}/${username}/proof/${file}`);
            } else {
                userData.proof = [];
            }

            userData.status = (userData.status && String(userData.status).toLowerCase() === 'banned') ? 'banned' : 'unbanned';
            return userData;
        } catch (error) {
            console.error(`Failed to load user data for ${username}:`, error);
            return null; // skip failed users
        }
    });

    // Fetch all users concurrently
    this.users = (await Promise.all(userPromises)).filter(u => u !== null);
    this.filteredUsers = [...this.users];
}

    
    renderServerHeader() {
        const serverHeader = document.getElementById('server-header');
        if (!serverHeader) return;
        
        serverHeader.innerHTML = `
            <div class="container">
                <div class="server-header-card glass">
                    <div class="server-header-content">
                        <div class="server-header-info">
                            <div class="server-header-icon" style="color: ${this.currentServer.accent}">
                                ${this.currentServer.emoji || '🌐'}
                            </div>
                            <div class="server-header-details">
                                <h2 data-testid="text-server-name">${this.escapeHtml(this.currentServer.name)}</h2>
                                <p data-testid="text-server-creator">Created by ${this.escapeHtml(this.currentServer.creator)}</p>
                                <p class="server-description">${this.currentServer.description || ''}</p>
                            </div>
                        </div>
                        <button class="invite-button" id="copy-invite" data-testid="button-copy-invite">
                            Copy Invite Link
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('copy-invite')?.addEventListener('click', () => {
            this.copyInviteLink();
        });
    }
    
    renderUsers() {
        const usersGrid = document.getElementById('users-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (!usersGrid) return;
        
        if (this.filteredUsers.length === 0) {
            usersGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        usersGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        usersGrid.innerHTML = '';
        
        this.filteredUsers.forEach((user, index) => {
            const tile = this.createUserTile(user, index);
            usersGrid.appendChild(tile);
        });
    }
    
    createUserTile(user, index) {
        const tile = document.createElement('div');
        tile.className = 'user-tile glass';
        tile.style.animationDelay = `${index * 0.05}s`;
        tile.setAttribute('data-testid', `card-user-${user.username}`);
        
        tile.innerHTML = `
            <div class="user-avatar">
                <img src="${user.pfp}" alt="${this.escapeHtml(user.username)}'s PFP"
                     onerror="this.src='default-pfp.png'" />
            </div>
            <div class="user-name" data-testid="text-username-${user.username}">${this.escapeHtml(user.username)}</div>
            <p class="user-id" data-testid="text-userid-${user.username}">${this.escapeHtml(user.userId)}</p>
            <span class="status-badge status-${user.status}" data-testid="badge-status-${user.username}">
                ${this.escapeHtml(user.status.toUpperCase())}
            </span>
            <p class="user-short-reason" data-testid="text-reason-${user.username}">${this.escapeHtml(user.shortReason)}</p>
            <div class="user-meta">
                <p data-testid="text-moderator-${user.username}">Mod: ${this.escapeHtml(user.moderator)}</p>
                <p data-testid="text-date-${user.username}">${this.escapeHtml(user.date)}</p>
            </div>
        `;
        
        tile.addEventListener('click', () => {
            this.openUserModal(user);
        });
        
        return tile;
    }
    
    setupSearchAndFilters() {
        const searchInput = document.getElementById('search-input');
        const statusFilter = document.getElementById('status-filter');
        const moderatorFilter = document.getElementById('moderator-filter');
        
        // Populate status filter with exact values we use
        if (statusFilter) {
            statusFilter.innerHTML = `
                <option value="">All Statuses</option>
                <option value="banned">Banned</option>
                <option value="unbanned">Unbanned</option>
            `;
            statusFilter.value = this.statusFilter || '';
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.filterUsers();
            });
        }
        
        // Populate moderator filter
        const moderators = [...new Set(this.users.map(user => user.moderator))];
        if (moderatorFilter) {
            moderatorFilter.innerHTML = '<option value="">All Moderators</option>';
            moderators.forEach(moderator => {
                const option = document.createElement('option');
                option.value = moderator;
                option.textContent = moderator;
                moderatorFilter.appendChild(option);
            });
            moderatorFilter.addEventListener('change', (e) => {
                this.moderatorFilter = e.target.value;
                this.filterUsers();
            });
        }
        
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterUsers();
        });
    }
    
    filterUsers() {
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !this.searchQuery ||
                (user.username && user.username.toLowerCase().includes(this.searchQuery)) ||
                (user.userId && user.userId.toLowerCase().includes(this.searchQuery));
            
            const matchesStatus = !this.statusFilter || (user.status === this.statusFilter);
            const matchesModerator = !this.moderatorFilter || (user.moderator === this.moderatorFilter);
            
            return matchesSearch && matchesStatus && matchesModerator;
        });
        
        this.renderUsers();
    }
    
    openUserModal(user) {
        // Prefer existing modal in servers.html if present
        const modal = document.getElementById('user-modal');
        if (modal) {
            // Fill modal fields
            const avatarEl = document.getElementById('modal-avatar');
            const usernameEl = document.getElementById('modal-username');
            const userIdEl = document.getElementById('modal-user-id');
            const statusEl = document.getElementById('modal-status');
            const reasonEl = document.getElementById('modal-reason');
            const moderatorEl = document.getElementById('modal-moderator');
            const dateEl = document.getElementById('modal-date');
            const proofGrid = document.getElementById('proof-grid');
            
            if (avatarEl) {
                avatarEl.innerHTML = `<img src="${user.pfp}" alt="${this.escapeHtml(user.username)}'s PFP" onerror="this.src='default-pfp.png'">`;
            }
            if (usernameEl) usernameEl.textContent = user.username || '';
            if (userIdEl) userIdEl.textContent = user.userId || '';
            if (statusEl) {
                statusEl.textContent = (user.status || '').toUpperCase();
                statusEl.className = `status-badge status-${user.status}`;
            }
            if (reasonEl) reasonEl.textContent = user.longReason || user.shortReason || '';
            if (moderatorEl) moderatorEl.textContent = user.moderator || '';
            if (dateEl) dateEl.textContent = user.date || '';
            
            if (proofGrid) {
                proofGrid.innerHTML = '';
                user.proof.forEach((p, i) => {
                    const a = document.createElement('a');
                    a.href = p;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.className = 'proof-link';
                    a.textContent = `Proof ${i + 1}`;
                    proofGrid.appendChild(a);
                });
            }
            
            // show modal
            modal.style.display = 'flex';
            
            // setup close
            const closeBtn = document.getElementById('close-user-modal');
            if (closeBtn) {
                const closeHandler = () => {
                    modal.style.display = 'none';
                    // remove listener so we don't register multiples
                    closeBtn.removeEventListener('click', closeHandler);
                };
                closeBtn.addEventListener('click', closeHandler);
            }
            
            return;
        }
        
        // fallback: simple modal built by script (rarely used)
        const fallback = document.createElement('div');
        fallback.className = 'modal-overlay glass';
        fallback.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">Close</button>
                <div style="text-align:center">
                    <div style="width:96px;height:96px;margin:0 auto;border-radius:50%;overflow:hidden">
                        <img src="${user.pfp}" style="width:100%;height:100%;object-fit:cover" onerror="this.src='default-pfp.png'"/>
                    </div>
                    <h3>${this.escapeHtml(user.username)}</h3>
                    <p><strong>ID:</strong> ${this.escapeHtml(user.userId)}</p>
                    <p><strong>Status:</strong> ${this.escapeHtml(user.status)}</p>
                    <p><strong>Moderator:</strong> ${this.escapeHtml(user.moderator)}</p>
                    <p><strong>Date:</strong> ${this.escapeHtml(user.date)}</p>
                    <p><strong>Reason:</strong> ${this.escapeHtml(user.longReason)}</p>
                    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
                        ${user.proof.map((p, i) => `<a href="${p}" target="_blank" rel="noopener noreferrer">Proof ${i+1}</a>`).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(fallback);
        fallback.querySelector('.modal-close')?.addEventListener('click', () => fallback.remove());
    }
    
    async copyInviteLink() {
        if (!this.currentServer?.invite) return;
        
        try {
            await navigator.clipboard.writeText(this.currentServer.invite);
            this.showToast('Invite link copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy invite link:', error);
            this.showToast('Failed to copy invite link', 'error');
        }
    }
    
    showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

window.addEventListener('DOMContentLoaded', () => new ServerManager());
