class LightboxManager {
    constructor() {
        this.lightbox = document.getElementById('proof-lightbox');
        this.lightboxImage = document.getElementById('lightbox-image');
        this.currentUser = null;
        this.currentProofIndex = 0;
        this.zoomLevel = 1;
        this.maxZoom = 3;
        this.minZoom = 0.5;
        this.zoomStep = 0.25;
        
        this.init();
    }
    
    init() {
        if (!this.lightbox) return;
        
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.setupTouchNavigation();
    }
    
    setupEventListeners() {
        // Close button
        const closeButton = document.getElementById('close-lightbox');
        closeButton?.addEventListener('click', () => this.closeLightbox());
        
        // Navigation buttons
        const prevButton = document.getElementById('prev-proof');
        const nextButton = document.getElementById('next-proof');
        
        prevButton?.addEventListener('click', () => this.previousProof());
        nextButton?.addEventListener('click', () => this.nextProof());
        
        // Zoom controls
        const zoomInButton = document.getElementById('zoom-in');
        const zoomOutButton = document.getElementById('zoom-out');
        const downloadButton = document.getElementById('download-proof');
        
        zoomInButton?.addEventListener('click', () => this.zoomIn());
        zoomOutButton?.addEventListener('click', () => this.zoomOut());
        downloadButton?.addEventListener('click', () => this.downloadProof());
        
        // Overlay click to close
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });
        
        // Mouse wheel zoom
        this.lightboxImage?.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
        
        // Prevent image context menu
        this.lightboxImage?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.isLightboxOpen()) return;
            
            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousProof();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextProof();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    this.resetZoom();
                    break;
            }
        });
    }
    
    setupTouchNavigation() {
        let startX = 0;
        let startY = 0;
        let initialPinchDistance = 0;
        let initialZoom = 1;
        
        this.lightboxImage?.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Pinch zoom
                initialPinchDistance = this.getDistance(e.touches[0], e.touches[1]);
                initialZoom = this.zoomLevel;
            }
        });
        
        this.lightboxImage?.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 2) {
                // Handle pinch zoom
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialPinchDistance;
                this.setZoom(initialZoom * scale);
            }
        });
        
        this.lightboxImage?.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const deltaX = endX - startX;
                const deltaY = endY - startY;
                
                // Swipe detection (minimum 50px movement)
                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0) {
                        this.previousProof();
                    } else {
                        this.nextProof();
                    }
                }
            }
        });
    }
    
    openLightbox(user, proofIndex = 0) {
        this.currentUser = user;
        this.currentProofIndex = proofIndex;
        this.resetZoom();
        this.updateImage();
        this.updateNavigationButtons();
        this.showLightbox();
    }
    
    closeLightbox() {
        this.hideLightbox();
        this.currentUser = null;
        this.currentProofIndex = 0;
    }
    
    previousProof() {
        if (!this.currentUser || !this.currentUser.proof) return;
        
        this.currentProofIndex = this.currentProofIndex > 0 
            ? this.currentProofIndex - 1 
            : this.currentUser.proof.length - 1;
        
        this.updateImage();
        this.updateNavigationButtons();
        this.resetZoom();
    }
    
    nextProof() {
        if (!this.currentUser || !this.currentUser.proof) return;
        
        this.currentProofIndex = this.currentProofIndex < this.currentUser.proof.length - 1 
            ? this.currentProofIndex + 1 
            : 0;
        
        this.updateImage();
        this.updateNavigationButtons();
        this.resetZoom();
    }
    
    updateImage() {
        if (!this.currentUser || !this.currentUser.proof || !this.lightboxImage) return;
        
        const proofFile = this.currentUser.proof[this.currentProofIndex];
        const serverName = this.getServerNameFromUrl();
        const imagePath = `data/${serverName}/${this.currentUser.username}/proofs/${proofFile}`;
        
        // Use placeholder image since we don't have actual proof images
        this.lightboxImage.src = `https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&h=600`;
        this.lightboxImage.alt = `Evidence: ${proofFile}`;
        
        // Handle image load errors
        this.lightboxImage.onerror = () => {
            this.lightboxImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMUYyOTM3Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE2MCA5MEwyNDAgOTBMMjAwIDE1MFoiIGZpbGw9IiM2Qjc2ODUiLz4KPGF0aD0iTTIwMCAxNTBMMTYwIDIxMEgyNDBMMjAwIDE1MFoiIGZpbGw9IiM2Qjc2ODUiLz4KPHRleHQgeD0iMjAwIiB5PSIyNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K';
        };
    }
    
    updateNavigationButtons() {
        if (!this.currentUser || !this.currentUser.proof) return;
        
        const prevButton = document.getElementById('prev-proof');
        const nextButton = document.getElementById('next-proof');
        
        const hasMultipleProofs = this.currentUser.proof.length > 1;
        
        if (prevButton) {
            prevButton.style.display = hasMultipleProofs ? 'block' : 'none';
        }
        
        if (nextButton) {
            nextButton.style.display = hasMultipleProofs ? 'block' : 'none';
        }
    }
    
    zoomIn() {
        this.setZoom(Math.min(this.zoomLevel + this.zoomStep, this.maxZoom));
    }
    
    zoomOut() {
        this.setZoom(Math.max(this.zoomLevel - this.zoomStep, this.minZoom));
    }
    
    resetZoom() {
        this.setZoom(1);
    }
    
    setZoom(zoom) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(zoom, this.maxZoom));
        
        if (this.lightboxImage) {
            this.lightboxImage.style.transform = `scale(${this.zoomLevel})`;
        }
        
        // Update zoom button states
        const zoomInButton = document.getElementById('zoom-in');
        const zoomOutButton = document.getElementById('zoom-out');
        
        if (zoomInButton) {
            zoomInButton.disabled = this.zoomLevel >= this.maxZoom;
        }
        
        if (zoomOutButton) {
            zoomOutButton.disabled = this.zoomLevel <= this.minZoom;
        }
    }
    
    async downloadProof() {
        if (!this.currentUser || !this.currentUser.proof || !this.lightboxImage.src) return;
        
        try {
            const response = await fetch(this.lightboxImage.src);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = this.currentUser.proof[this.currentProofIndex] || 'proof.png';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
            
            this.showToast('Image downloaded successfully!');
        } catch (error) {
            console.error('Failed to download image:', error);
            this.showToast('Failed to download image', 'error');
        }
    }
    
    showLightbox() {
        this.lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const closeButton = document.getElementById('close-lightbox');
        closeButton?.focus();
    }
    
    hideLightbox() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    isLightboxOpen() {
        return this.lightbox && this.lightbox.style.display === 'flex';
    }
    
    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getServerNameFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('name') || 'fluffy-cafe';
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
}

// Initialize lightbox manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.LightboxManager = new LightboxManager();
});

// Export for use in other modules
window.LightboxManager = LightboxManager;
