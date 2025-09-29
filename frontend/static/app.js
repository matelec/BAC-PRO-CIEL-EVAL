// ===== APP.JS - SCRIPT PRINCIPAL =====
console.log('🚀 APP.JS CHARGÉ');

// ===== VARIABLES GLOBALES =====
window.AppGlobals = {
    // URLs de l'API
    API_BASE: '',
    
    // États globaux
    currentPage: null,
    isLoading: false,
    
    // Configuration
    config: {
        notificationTimeout: 5000,
        animationDuration: 300
    }
};

// ===== CLASSE PRINCIPALE DE L'APPLICATION =====
class BacProCielApp {
    constructor() {
        this.modules = {};
        this.notifications = [];
        this.init();
    }

    // Initialisation principale
    init() {
        console.log('🔧 Initialisation de l\'application...');
        
        // Détecter la page courante
        this.detectCurrentPage();
        
        // Initialiser les composants généraux
        this.initGeneralComponents();
        
        // Charger le module spécifique à la page
        this.loadPageModule();
        
        console.log('✅ Application initialisée');
    }

    // Détecter la page courante
    detectCurrentPage() {
        const path = window.location.pathname;
        const body = document.body;
        
        if (path.includes('/utilisateurs') || body.querySelector('.users-management')) {
            window.AppGlobals.currentPage = 'users';
        } else if (path.includes('/evaluations') || body.querySelector('.evaluations-page')) {
            window.AppGlobals.currentPage = 'evaluations';
        } else if (path.includes('/referentiel') || body.querySelector('.referentiel-page')) {
            window.AppGlobals.currentPage = 'referentiel';
        } else {
            window.AppGlobals.currentPage = 'dashboard';
        }
        
        console.log('📄 Page détectée:', window.AppGlobals.currentPage);
    }

    // Composants généraux (navbar, modals, etc.)
    initGeneralComponents() {
        console.log('🔧 Initialisation composants généraux...');
        
        // Gestion des modals génériques
        this.initModals();
        
        // Navigation
        this.initNavigation();
        
        // Raccourcis clavier
        this.initKeyboardShortcuts();
    }

    // Initialisation des modals
    initModals() {
        // Fermeture des modals avec le bouton X
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Fermeture avec les boutons .modal-close (boutons "Annuler")
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });
        
        // Fermeture en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    // Navigation générale
    initNavigation() {
        // Liens actifs dans la navbar
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-menu a').forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }

    // Raccourcis clavier
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Échap pour fermer les modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl + R pour actualiser
            if (e.ctrlKey && e.key === 'r' && window.AppGlobals.currentPage === 'users') {
                e.preventDefault();
                window.location.reload();
            }
        });
    }

    // Charger le module spécifique à la page
    loadPageModule() {
        switch (window.AppGlobals.currentPage) {
            case 'users':
                if (window.UsersModule) {
                    this.modules.users = new window.UsersModule();
                }
                break;
            case 'evaluations':
                if (window.EvaluationsModule) {
                    this.modules.evaluations = new window.EvaluationsModule();
                }
                break;
            case 'referentiel':
                if (window.ReferentielModule) {
                    this.modules.referentiel = new window.ReferentielModule();
                }
                break;
        }
    }

    // ===== GESTION DES MODALS =====
    openModal(modalId, data = null) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} non trouvé`);
            return;
        }
        
        modal.style.display = 'block';
        modal.classList.add('modal-opening');
        
        // Animation d'ouverture
        setTimeout(() => {
            modal.classList.remove('modal-opening');
        }, window.AppGlobals.config.animationDuration);
        
        // Callback pour les données
        if (data && modal.dataset.onOpen) {
            window[modal.dataset.onOpen](data);
        }
    }

    closeModal(modal) {
        if (!modal) return;
        
        modal.classList.add('modal-closing');
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('modal-closing');
        }, window.AppGlobals.config.animationDuration);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.closeModal(modal);
        });
    }

    // ===== SYSTÈME DE NOTIFICATIONS =====
    showNotification(message, type = 'info', duration = null) {
        // Supprimer notifications existantes
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        const notificationId = 'notif_' + Date.now();
        
        notification.id = notificationId;
        notification.className = `notification notification-${type}`;
        
        // Icônes selon le type
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="app.closeNotification('${notificationId}')">×</button>
            </div>
        `;
        
        // Styles
        const colors = {
            'success': '#27ae60',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#3498db'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 1000;
            background: ${colors[type] || colors.info};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Suppression automatique
        const timeoutDuration = duration || window.AppGlobals.config.notificationTimeout;
        setTimeout(() => {
            this.closeNotification(notificationId);
        }, timeoutDuration);
        
        // Stocker la référence
        this.notifications.push({
            id: notificationId,
            element: notification,
            type: type
        });
    }

    closeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (!notification) return;
        
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
        
        // Supprimer de la liste
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }

    // ===== UTILITAIRES =====
    
    // Requêtes HTTP simplifiées
    async apiRequest(url, options = {}) {
        window.AppGlobals.isLoading = true;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error('Erreur API:', error);
            return { success: false, error: error.message };
        } finally {
            window.AppGlobals.isLoading = false;
        }
    }

    // Validation de formulaire générique
    validateForm(formElement) {
        const errors = [];
        const formData = new FormData(formElement);
        
        // Vérifications de base
        formElement.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                errors.push(`Le champ "${field.name}" est obligatoire`);
            }
        });
        
        // Validation email
        formElement.querySelectorAll('[type="email"]').forEach(field => {
            if (field.value && !this.isValidEmail(field.value)) {
                errors.push(`L'email "${field.value}" n'est pas valide`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            data: Object.fromEntries(formData)
        };
    }

    // Validation email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Formatage de dates
    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        } catch (error) {
            return dateString;
        }
    }

    // Debounce pour les recherches
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// ===== INITIALISATION =====
let app;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM chargé, initialisation de l\'application...');
    app = new BacProCielApp();
});

// Export global pour les modules
window.App = BacProCielApp;