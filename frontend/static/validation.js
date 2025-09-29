// validation.js - Gestion des validations avec enregistrement global

console.log('📋 MODULE VALIDATION CHARGÉ');

// Fonction d'initialisation principale
function initValidation() {
    // Gestion des clics sur les boutons de validation
    document.querySelectorAll('.btn-validation').forEach(button => {
        button.addEventListener('click', function() {
            const validationItem = this.closest('.validation-item');
            if (!validationItem) {
                console.error('Element .validation-item non trouvé');
                return;
            }
            
            const itemId = validationItem.getAttribute('data-item-id');
            const niveau = this.getAttribute('data-niveau');
            
            if (!itemId || !niveau) {
                console.error('ID item ou niveau manquant');
                return;
            }
            
            console.log(`Validation - Item: ${itemId}, Niveau: ${niveau}`);
            
            // Mettre à jour l'interface pour cet item
            updateValidationUI(validationItem, itemId, niveau);
        });
    });
    
    // Enregistrement global
    const saveButton = document.getElementById('saveAllValidations');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            submitAllValidations();
        });
    }
    
    // Initialisation des badges au chargement
    initValidationBadges();
}

function initValidationBadges() {
    document.querySelectorAll('.validation-item').forEach(item => {
        const itemId = item.getAttribute('data-item-id');
        if (!itemId) return;
        
        const niveauInput = item.querySelector(`input[name="niveau_${itemId}"]`);
        if (niveauInput && niveauInput.value !== '0') {
            updateStatusBadge(item, niveauInput.value);
            
            const activeBtn = item.querySelector(`.btn-validation[data-niveau="${niveauInput.value}"]`);
            if (activeBtn) {
                item.querySelectorAll('.btn-validation').forEach(btn => {
                    btn.classList.remove('active');
                });
                activeBtn.classList.add('active');
            }
        }
    });
}

function updateValidationUI(validationItem, itemId, niveau) {
    // Retirer la classe active de tous les boutons
    validationItem.querySelectorAll('.btn-validation').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activer le bouton cliqué
    const activeBtn = validationItem.querySelector(`.btn-validation[data-niveau="${niveau}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Mettre à jour le champ caché
    const niveauInput = validationItem.querySelector(`input[name="niveau_${itemId}"]`);
    if (niveauInput) {
        niveauInput.value = niveau;
    }
    
    // Mettre à jour le badge
    updateStatusBadge(validationItem, niveau);
}

function updateStatusBadge(validationItem, niveau) {
    const statusBadge = validationItem.querySelector('.validation-status .status-badge');
    const statusText = {
        '0': '⏳ Non validé',
        '1': '🟥 Non Acquis',
        '2': '🟧 En Cours', 
        '3': '🟩 Acquis',
        '4': '✅ Expert'
    };
    
    if (statusBadge) {
        statusBadge.textContent = statusText[niveau] || statusText['0'];
        statusBadge.className = 'status-badge status-' + niveau;
    }
}

async function submitAllValidations() {
    console.log('Début enregistrement global...');
    
    const form = document.getElementById('globalValidationForm');
    if (!form) {
        alert('❌ Formulaire de validation non trouvé');
        return;
    }
    
    const formData = new FormData(form);
    
    // Préparer les données
    const validationsData = [];
    const items = document.querySelectorAll('.validation-item');
    
    items.forEach(item => {
        const itemId = item.getAttribute('data-item-id');
        if (!itemId) return;
        
        const niveauInput = item.querySelector(`input[name="niveau_${itemId}"]`);
        const commentaireInput = item.querySelector(`textarea[name="commentaire_${itemId}"]`);
        
        const niveau = niveauInput ? niveauInput.value : '0';
        const commentaire = commentaireInput ? commentaireInput.value : '';
        
        if (niveau !== '0') {
            validationsData.push({
                item_id: parseInt(itemId),
                niveau_validation: parseInt(niveau),
                commentaire: commentaire
            });
        }
    });
    
    if (validationsData.length === 0) {
        alert('Veuillez sélectionner au moins un niveau de validation');
        return;
    }
    
    const data = {
        utilisateur_id: parseInt(formData.get('utilisateur_id')),
        evaluation_id: parseInt(formData.get('evaluation_id')),
        validations: validationsData
    };
    
    console.log('Envoi des données:', data);
    
    try {
        const saveButton = document.getElementById('saveAllValidations');
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
        saveButton.disabled = true;
        
        const response = await fetch('/api/valider-multiple', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('Réponse serveur:', result);
        
        if (result.success) {
            alert('✅ Validations enregistrées avec succès !');
            window.location.reload();
        } else {
            alert('❌ Erreur: ' + (result.error || 'Erreur inconnue'));
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur de communication avec le serveur');
    } finally {
        const saveButton = document.getElementById('saveAllValidations');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> Enregistrer toutes les validations';
            saveButton.disabled = false;
        }
    }
}

// Gestion du chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initValidation);
} else {
    initValidation();
}