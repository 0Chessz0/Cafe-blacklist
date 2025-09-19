class ModalManager {
    constructor() {
        this.userModal = document.getElementById('user-modal');
        this.currentUser = null;
        
        this.init();
    }
    
    init() {
        if (!this.userModal) return;
        
        // Setup close button
        const closeButton = document.getElementById('close-user-modal');
        closeButton?.addEventListener('click', () => this.closeUserModal());
        
        // Setup overlay click to close
        this.userModal.addEventListener('click', (e) => {
            if (e.target === this.userModal) {
                this.closeUserModal();
            }
        });
        
        // Setup escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeUserModal();
            }
        });
        
        // Prevent modal content clicks from closing modal
        const modalContent = this.userModal.querySelector('.modal-content');
        modalContent?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    openUserModal(user) {
        this.currentUser = user;
        this.populateModalData(user);
        this.showModal();
        this.trapFocus();
    }
    
    closeUserModal() {
        this.hideModal();
        this.currentUser = null;
        this.releaseFocus();
    }
    
    populateModalData(user) {
        // Update avatar
        const avatar = document.getElementById('modal-avatar');
        if (avatar) {
            avatar.textContent = '👤';
        }
        
        // Update user info
        this.updateElementText('modal-username', user.username);
        this.updateElementText('modal-user-id', user.userId);
        
        // Update status badge
        const statusBadge = document.getElementById('modal-status');
        if (statusBadge) {
            statusBadge.textContent = user.status.toUpperCase();
            statusBadge.className = `status-badge status-${user.status}`;
        }
        
        // Update details
        this.updateElementText('modal-reason', user.longReason);
        this.updateElementText('modal-moderator', user.moderator);
        this.updateElementText('modal-date', user.date);
        
        // Update proof grid
        this.renderProofGrid(user);
    }
    
    renderProofGrid(user) {
        const proofGrid = document.getElementById('proof-grid');
        if (!proofGrid) return;
        
        proofGrid.innerHTML = '';
        
        if (!user.proof || user.proof.length === 0) {
            proofGrid.innerHTML = '<p class="section-content">No evidence available</p>';
            return;
        }
        
        user.proof.forEach((proofFile, index) => {
            const proofButton = document.createElement('button');
            proofButton.className = 'proof-button glass';
            proofButton.setAttribute('data-testid', `button-proof-${index}`);
            
            proofButton.innerHTML = `
                <div class="proof-icon">📸</div>
                <p class="proof-name">${this.escapeHtml(proofFile)}</p>
            `;
            
            proofButton.addEventListener('click', () => {
                this.openLightbox(user, index);
            });
            
            proofGrid.appendChild(proofButton);
        });
    }
    
    openLightbox(user, proofIndex) {
        if (window.LightboxManager) {
            window.LightboxManager.openLightbox(user, proofIndex);
        }
    }
    
    showModal() {
        this.userModal.style.display = 'flex';
        // Trigger reflow to ensure animation plays
        this.userModal.offsetHeight;
        this.userModal.classList.add('fade-in');
        document.body.style.overflow = 'hidden';
    }
    
    hideModal() {
        this.userModal.style.display = 'none';
        this.userModal.classList.remove('fade-in');
        document.body.style.overflow = '';
    }
    
    isModalOpen() {
        return this.userModal && this.userModal.style.display === 'flex';
    }
    
    trapFocus() {
        // Simple focus trap implementation
        const focusableElements = this.userModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus first element
        firstElement.focus();
        
        // Handle tab key
        this.handleTabKey = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        
        document.addEventListener('keydown', this.handleTabKey);
    }
    
    releaseFocus() {
        if (this.handleTabKey) {
            document.removeEventListener('keydown', this.handleTabKey);
            this.handleTabKey = null;
        }
    }
    
    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.escapeHtml(text);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize modal manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ModalManager = new ModalManager();
});

// Export for use in other modules
window.ModalManager = ModalManager;
