
// ===== EVALUATIONS.JS - MODULE GESTION ÉVALUATIONS =====
console.log('📋 MODULE ÉVALUATIONS CHARGÉ');

class EvaluationsModule {
    constructor() {
        this.currentEvalId = null;
        this.currentDeletingEvalId = null;
        this.init();
    }

    init() {
        console.log('🔧 Initialisation module évaluations...');
        
        // Vérifier si on est sur la bonne page
        if (!document.querySelector('.evaluation-detail')) {
            console.log('⚠️ Page évaluation non détectée');
            return;
        }

        this.initAttributionToggle();
        this.initAttributionForm();
        this.initItemsManagement();
        this.initEvaluationActions();
        this.initFilters();
        this.initEditEvaluation();
        
        console.log('✅ Module évaluations initialisé');
    }

    // ===== TOGGLE ATTRIBUTION =====
    initAttributionToggle() {
        const toggleBtn = document.getElementById('toggleAttributionBtn');
        const section = document.getElementById('attributionSection');
        
        if (toggleBtn && section) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = section.style.display === 'none';
                section.style.display = isHidden ? 'block' : 'none';
                toggleBtn.innerHTML = isHidden 
                    ? '<i class="fas fa-minus"></i> Masquer'
                    : '<i class="fas fa-plus"></i> Attribuer';
            });
        }

        const cancelBtn = document.getElementById('cancelAttributionBtn');
        if (cancelBtn && section) {
            cancelBtn.addEventListener('click', () => {
                section.style.display = 'none';
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<i class="fas fa-plus"></i> Attribuer';
                }
            });
        }
    }

    // ===== FORMULAIRE ATTRIBUTION =====
    initAttributionForm() {
        // Toggle entre classe et utilisateur
        const radioButtons = document.querySelectorAll('input[name="type_attribution"]');
        const classeSection = document.getElementById('attributionClasse');
        const userSection = document.getElementById('attributionUtilisateur');
        
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'classe') {
                    classeSection.style.display = 'block';
                    userSection.style.display = 'none';
                    document.getElementById('user_select').required = false;
                    document.getElementById('classe_select').required = true;
                } else {
                    classeSection.style.display = 'none';
                    userSection.style.display = 'block';
                    document.getElementById('user_select').required = true;
                    document.getElementById('classe_select').required = false;
                }
            });
        });

        // Soumission du formulaire
        const form = document.getElementById('attributionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAttribution(e.target);
            });
        }

        // Retirer une attribution
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-attribution-btn')) {
                const btn = e.target.closest('.remove-attribution-btn');
                const attrId = btn.getAttribute('data-attribution-id');
                this.removeAttribution(attrId);
            }
        });
    }

    // Traiter l'attribution
    async handleAttribution(form) {
        const formData = new FormData(form);
        const data = {
            evaluation_id: formData.get('evaluation_id'),
            type: formData.get('type_attribution')
        };

        if (data.type === 'classe') {
            data.classe = formData.get('classe');
        } else {
            data.utilisateur_id = formData.get('utilisateur_id');
        }

        try {
            const response = await fetch('/api/attribuer-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                app.showNotification('✅ Évaluation attribuée avec succès', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                app.showNotification('❌ Erreur: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Erreur attribution:', error);
            app.showNotification('❌ Erreur de communication', 'error');
        }
    }

    // Retirer une attribution
    async removeAttribution(attrId) {
        if (!confirm('Retirer cette attribution ?')) return;

        try {
            const response = await fetch('/api/retirer-attribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attribution_id: parseInt(attrId) })
            });

            const result = await response.json();

            if (result.success) {
                app.showNotification('Attribution retirée', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                app.showNotification('Erreur: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            app.showNotification('Erreur de communication', 'error');
        }
    }

    // ===== GESTION DES ITEMS =====
    initItemsManagement() {
        // CORRECTION : Bouton ajouter des items - ID corrigé
        const addItemsBtn = document.getElementById('addItemsBtn');
        if (addItemsBtn) {
            console.log('✅ Bouton "Ajouter des items" trouvé');
            addItemsBtn.addEventListener('click', () => {
                console.log('🔄 Ouverture modal ajout items');
                app.openModal('addItemModal');
            });
        } else {
            console.log('❌ Bouton "Ajouter des items" non trouvé - ID: addItemsBtn');
        }

        // Formulaire ajout items
        const addItemForm = document.getElementById('addItemForm');
        if (addItemForm) {
            addItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddItems(e.target);
            });
        }

        // Boutons retirer un item
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item-btn')) {
                const btn = e.target.closest('.remove-item-btn');
                const itemId = btn.getAttribute('data-item-id');
                this.removeItem(itemId);
            }
        });
    }

    // Ajouter des items à l'évaluation
    async handleAddItems(form) {
        const formData = new FormData(form);
        const evaluationId = formData.get('evaluation_id');
        const selectedItems = formData.getAll('items[]');

        if (selectedItems.length === 0) {
            app.showNotification('Veuillez sélectionner au moins un item', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/ajouter-items-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    evaluation_id: parseInt(evaluationId),
                    items_ids: selectedItems.map(id => parseInt(id))
                })
            });

            const result = await response.json();

            if (result.success) {
                app.showNotification(`✅ ${selectedItems.length} item(s) ajouté(s)`, 'success');
                app.closeModal(document.getElementById('addItemModal'));
                setTimeout(() => window.location.reload(), 1000);
            } else {
                app.showNotification('❌ Erreur: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            app.showNotification('❌ Erreur de communication', 'error');
        }
    }

    // Retirer un item de l'évaluation
    async removeItem(itemId) {
        if (!confirm('Retirer cet item de l\'évaluation ?')) return;

        const evalId = document.querySelector('[data-eval-id]')?.getAttribute('data-eval-id');

        try {
            const response = await fetch('/api/retirer-item-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    evaluation_id: parseInt(evalId),
                    item_id: parseInt(itemId)
                })
            });

            const result = await response.json();

            if (result.success) {
                app.showNotification('Item retiré', 'success');
                // Supprimer visuellement la carte
                const card = document.querySelector(`.item-card[data-item-id="${itemId}"]`);
                if (card) {
                    card.remove();
                }
            } else {
                app.showNotification('Erreur: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            app.showNotification('Erreur de communication', 'error');
        }
    }

    // ===== ACTIONS ÉVALUATION =====
    initEvaluationActions() {
        // Bouton modifier
        const editBtn = document.getElementById('editEvalBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                console.log("🔄 Ouverture modal modification évaluation");
                app.openModal('editEvalModal');
            });
        }

        // Bouton supprimer
        const deleteBtn = document.getElementById('deleteEvalBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.currentDeletingEvalId = deleteBtn.getAttribute('data-eval-id');
                const evalName = deleteBtn.getAttribute('data-eval-name');
                
                const textElement = document.getElementById('deleteEvalText');
                if (textElement) {
                    textElement.textContent = `Êtes-vous sûr de vouloir supprimer "${evalName}" ?`;
                }
                
                app.openModal('deleteEvalModal');
            });
        }

        // Confirmation suppression
        const confirmDeleteBtn = document.getElementById('confirmDeleteEvalBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confirmDeleteEvaluation();
            });
        }
    }

    // Confirmer suppression évaluation
    async confirmDeleteEvaluation() {
        if (!this.currentDeletingEvalId) return;

        try {
            const response = await fetch('/api/supprimer-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluation_id: parseInt(this.currentDeletingEvalId) })
            });

            const result = await response.json();

            if (result.success) {
                app.showNotification('✅ Évaluation supprimée', 'success');
                app.closeModal(document.getElementById('deleteEvalModal'));
                setTimeout(() => {
                    window.location.href = '/evaluations';
                }, 1000);
            } else {
                app.showNotification('❌ Erreur: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            app.showNotification('❌ Erreur de communication', 'error');
        }
    }

    // ===== FILTRES ET RECHERCHE =====
    initFilters() {
        // Filtre par compétence
        const filterCompetence = document.getElementById('filterCompetence');
        if (filterCompetence) {
            filterCompetence.addEventListener('change', () => {
                this.filterItems();
            });
        }

        // Recherche d'items
        const searchItem = document.getElementById('searchItem');
        if (searchItem) {
            searchItem.addEventListener('input', () => {
                this.filterItems();
            });
        }
    }

    // Filtrer les items
    filterItems() {
        const competenceFilter = document.getElementById('filterCompetence')?.value.toLowerCase() || '';
        const searchTerm = document.getElementById('searchItem')?.value.toLowerCase() || '';
        
        const items = document.querySelectorAll('.checkbox-item');
        
        items.forEach(item => {
            const competence = item.getAttribute('data-competence')?.toLowerCase() || '';
            const text = item.textContent.toLowerCase();
            
            const matchCompetence = !competenceFilter || competence.includes(competenceFilter);
            const matchSearch = !searchTerm || text.includes(searchTerm);
            
            item.style.display = matchCompetence && matchSearch ? 'flex' : 'none';
        });
    }

    initEditEvaluation() {
        // Gérer la soumission du formulaire de modification
        const editForm = document.getElementById('editEvalForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditEvaluation(e.target);
            });
        }
    }

    async handleEditEvaluation(form) {
        const formData = new FormData(form);
        
        const data = {
            evaluation_id: parseInt(formData.get('evaluation_id')),
            pole: formData.get('pole'),
            module: formData.get('module'),
            contexte: formData.get('contexte')
        };

        console.log("🔍 Données modification évaluation:", data);

        try {
            const response = await fetch('/api/modifier-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                app.showNotification('✅ Évaluation modifiée avec succès', 'success');
                app.closeModal(document.getElementById('editEvalModal'));
                setTimeout(() => window.location.reload(), 1000);
            } else {
                app.showNotification('❌ Erreur modification: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Erreur modification:', error);
            app.showNotification('❌ Erreur de communication', 'error');
        }
    }

    // ===== UTILITAIRES =====
    showLoading(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
        button.disabled = true;
        return originalText;
    }

    hideLoading(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'objet app existe
    if (typeof app === 'undefined') {
        console.error('❌ Objet app non trouvé - le module de base doit être chargé en premier');
        return;
    }
    
    // Initialiser le module évaluations
    window.evaluationsModule = new EvaluationsModule();
    
    // Gestion des fermetures de modals
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-close') || e.target.classList.contains('close')) {
            app.closeModal(e.target.closest('.modal'));
        }
        
        if (e.target.classList.contains('modal')) {
            app.closeModal(e.target);
        }
    });
    
    // Gestion de la touche Échap pour fermer les modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="display: block"]');
            if (openModal) {
                app.closeModal(openModal);
            }
        }
    });
});

// ===== FONCTIONS GLOBALES POUR LA PAGE =====
function openAddItemsModal() {
    app.openModal('addItemModal');
}

function confirmDeleteEvaluation(evalId, evalName) {
    const textElement = document.getElementById('deleteEvalText');
    if (textElement) {
        textElement.textContent = `Êtes-vous sûr de vouloir supprimer "${evalName}" ?`;
    }
    
    const confirmBtn = document.getElementById('confirmDeleteEvalBtn');
    if (confirmBtn) {
        confirmBtn.setAttribute('data-eval-id', evalId);
    }
    
    app.openModal('deleteEvalModal');
}

// Fonction pour rafraîchir les données (peut être appelée depuis d'autres modules)
function refreshEvaluationData() {
    if (window.evaluationsModule) {
        console.log('🔄 Rafraîchissement des données évaluation...');
        // À implémenter selon les besoins spécifiques
    }
}

// Export pour les modules ES6 (si utilisé)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EvaluationsModule;
}
