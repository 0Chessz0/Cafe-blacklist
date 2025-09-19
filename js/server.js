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
        
        // Check if we're on the landing page or server page
        if (window.location.pathname.includes('server.html')) {
            await this.initServerPage();
        } else {
            this.initLandingPage();
        }
    }
    
    async loadServers() {
        try {
            const response = await fetch('data/servers.json');
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
        const isFluffyCafe = serverKey === 'fluffy-cafe';
        const accentColor = isFluffyCafe ? '#a6e3ff' : '#ffcc80';
        const emoji = isFluffyCafe ? '☕' : '🏠';
        const description = isFluffyCafe 
            ? 'Community server focused on cozy discussions and friendly atmosphere'
            : 'Humble community hub for casual conversations and shared interests';
        
        card.className = `server-card glass ${isFluffyCafe ? 'server-fluffy' : 'server-humble'}`;
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.color = accentColor;
        card.setAttribute('data-testid', `card-server-${serverKey}`);
        
        card.innerHTML = `
            <div class="server-icon" style="color: ${accentColor}">
                ${emoji}
            </div>
            <h3 class="server-name">${this.escapeHtml(server.name)}</h3>
            <p class="server-description">${description}</p>
            <div class="server-meta">
                <span>Creator: ${this.escapeHtml(server.creator)}</span>
                <span>•</span>
                <span>${server.users.length} Listed User${server.users.length !== 1 ? 's' : ''}</span>
            </div>
            <button class="server-button" style="border-color: ${accentColor}">
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
        
        // Update page title
        document.getElementById('page-title').textContent = `${server.name} - Blacklist`;
        
        // Load user data for each user in the server
        for (const username of server.users) {
            try {
                const response = await fetch(`data/${serverName}/${username}/user.json`);
                const userData = await response.json();
                this.users.push(userData);
            } catch (error) {
                console.error(`Failed to load user data for ${username}:`, error);
            }
        }
        
        this.filteredUsers = [...this.users];
    }
    
    renderServerHeader() {
        const serverHeader = document.getElementById('server-header');
        if (!serverHeader) return;
        
        const isFluffyCafe = this.currentServer.name === 'Fluffy Cafe';
        const accentColor = isFluffyCafe ? '#a6e3ff' : '#ffcc80';
        const emoji = isFluffyCafe ? '☕' : '🏠';
        
        serverHeader.innerHTML = `
            <div class="container">
                <div class="server-header-card glass">
                    <div class="server-header-content">
                        <div class="server-header-info">
                            <div class="server-header-icon" style="color: ${accentColor}">
                                ${emoji}
                            </div>
                            <div class="server-header-details">
                                <h2 data-testid="text-server-name">${this.escapeHtml(this.currentServer.name)}</h2>
                                <p data-testid="text-server-creator">Created by ${this.escapeHtml(this.currentServer.creator)}</p>
                            </div>
                        </div>
                        <button class="invite-button" id="copy-invite" data-testid="button-copy-invite">
                            Copy Invite Link
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Setup invite copy functionality
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
            <div class="user-avatar">👤</div>
            <div class="user-name" data-testid="text-username-${user.username}">${this.escapeHtml(user.username)}</div>
            <p class="user-id" data-testid="text-userid-${user.username}">${this.escapeHtml(user.userId)}</p>
            <span class="status-badge status-${user.status}" data-testid="badge-status-${user.username}">
                ${user.status.toUpperCase()}
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
        
        // Populate moderator filter with unique moderators
        const moderators = [...new Set(this.users.map(user => user.moderator))];
        moderatorFilter.innerHTML = '<option value="">All Moderators</option>';
        moderators.forEach(moderator => {
            const option = document.createElement('option');
            option.value = moderator;
            option.textContent = moderator;
            moderatorFilter.appendChild(option);
        });
        
        // Setup event listeners
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterUsers();
        });
        
        statusFilter?.addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.filterUsers();
        });
        
        moderatorFilter?.addEventListener('change', (e) => {
            this.moderatorFilter = e.target.value;
            this.filterUsers();
        });
    }
    
    filterUsers() {
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !this.searchQuery || 
                user.username.toLowerCase().includes(this.searchQuery) ||
                user.userId.toLowerCase().includes(this.searchQuery);
            
            const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
            const matchesModerator = !this.moderatorFilter || user.moderator === this.moderatorFilter;
            
            return matchesSearch && matchesStatus && matchesModerator;
        });
        
        this.renderUsers();
    }
    
    openUserModal(user) {
        // This will be handled by modal.js
        if (window.ModalManager) {
            window.ModalManager.openUserModal(user);
        }
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
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize server manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.serverManager = new ServerManager();
});

// Export for use in other modules
window.ServerManager = ServerManager;
