// ===== SCRIPT.JS COMPLÈTEMENT RÉPARÉ =====
console.log('🚀 SCRIPT.JS CHARGÉ');

// ===== VARIABLES GLOBALES =====
let currentEditingUserId = null;
let currentDeletingUserId = null;

// ===== INITIALISATION PRINCIPALE =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM chargé, initialisation...');
    
    // Vérifier si on est sur la page utilisateurs
    const importSection = document.getElementById('importSection');
    if (importSection) {
        console.log('👥 Page utilisateurs détectée');
        initUsersManagement();
    }
    
    initGeneralComponents();
    console.log('✅ Application initialisée');
});

// ===== COMPOSANTS GÉNÉRAUX =====
function initGeneralComponents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
    
    const classeFilter = document.getElementById('classeFilter');
    if (classeFilter) {
        classeFilter.addEventListener('change', filterUsers);
    }
}

// ===== GESTION UTILISATEURS =====
function initUsersManagement() {
    console.log('🔧 Initialisation gestion utilisateurs...');
    
    initToggleButtons();
    initUserActions();
    initUserModals();
    
    console.log('✅ Gestion utilisateurs initialisée');
}

// ===== BOUTONS TOGGLE =====
function initToggleButtons() {
    console.log('🔘 Initialisation boutons toggle...');
    
    const toggleImportBtn = document.getElementById('toggleImportBtn');
    const toggleAjoutBtn = document.getElementById('toggleAjoutBtn');
    const importSection = document.getElementById('importSection');
    const ajoutSection = document.getElementById('ajoutSection');

    if (!toggleImportBtn || !toggleAjoutBtn) {
        console.error('❌ Boutons toggle non trouvés');
        return;
    }

    // Fonction pour masquer toutes les sections
    function hideAllSections() {
        if (importSection) importSection.style.display = 'none';
        if (ajoutSection) ajoutSection.style.display = 'none';
        toggleImportBtn.classList.remove('active');
        toggleAjoutBtn.classList.remove('active');
    }

    // Fonction pour afficher une section
    function showSection(section, button) {
        hideAllSections();
        if (section) {
            section.style.display = 'block';
            section.classList.add('active');
        }
        if (button) {
            button.classList.add('active');
        }
        
        // Si c'est la section import, initialiser l'upload
        if (section === importSection) {
            setTimeout(() => {
                initFileUpload();
            }, 100);
        }
    }

    // Événement bouton Import
    toggleImportBtn.addEventListener('click', function() {
        console.log('🖱️ Clic bouton Import Excel');
        if (!importSection || importSection.style.display === 'none') {
            showSection(importSection, this);
        } else {
            hideAllSections();
        }
    });

    // Événement bouton Ajout
    toggleAjoutBtn.addEventListener('click', function() {
        console.log('🖱️ Clic bouton Ajout manuel');
        if (!ajoutSection || ajoutSection.style.display === 'none') {
            showSection(ajoutSection, this);
        } else {
            hideAllSections();
        }
    });

    console.log('✅ Boutons toggle configurés');
}

// ===== UPLOAD FICHIER =====
function initFileUpload() {
    console.log('📁 Initialisation upload fichier...');
    
    const uploadArea = document.getElementById('uploadArea');
    const excelFile = document.getElementById('excelFile');
    const chooseFileBtn = document.getElementById('chooseFileBtn');

    if (!uploadArea) {
        console.error('❌ uploadArea non trouvé');
        return;
    }
    
    if (!excelFile) {
        console.error('❌ excelFile non trouvé');
        return;
    }

    console.log('✅ Éléments upload trouvés');

    // Événement clic sur zone upload
    uploadArea.addEventListener('click', function(e) {
        // Ne pas déclencher si on clique sur le bouton
        if (e.target.closest('#chooseFileBtn')) {
            return;
        }
        console.log('🖱️ Clic zone upload');
        excelFile.click();
    });

    // Événement bouton choisir fichier
    if (chooseFileBtn) {
        chooseFileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Clic bouton choisir fichier');
            excelFile.click();
        });
    }

    // Événement changement fichier
    excelFile.addEventListener('change', function(e) {
        console.log('📁 Fichier sélectionné');
        if (this.files.length > 0) {
            handleFileSelect(this.files[0]);
        }
    });

    // Drag & Drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        console.log('📦 Fichiers droppés:', files.length);
        
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // Bouton template
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', downloadTemplate);
    }

    console.log('✅ Upload configuré');
}

// ===== GESTION FICHIER =====
function handleFileSelect(file) {
    console.log('📁 handleFileSelect appelé:', file.name);
    
    if (!file) {
        console.error('❌ Aucun fichier');
        return;
    }

    // Vérifications
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        showNotification("Format non supporté. Utilisez .xlsx ou .xls", "error");
        return;
    }
    
    if (file.size === 0) {
        showNotification("Le fichier est vide", "error");
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showNotification("Fichier trop volumineux (max 10MB)", "error");
        return;
    }

    console.log('✅ Fichier valide, envoi...');

    // Afficher progress
    const progressSection = document.getElementById('uploadProgress');
    if (progressSection) {
        progressSection.style.display = 'block';
    }

    // Préparer FormData
    const formData = new FormData();
    formData.append("file", file);

    // Envoyer
    fetch("/import-utilisateurs", {
        method: "POST",
        body: formData
    })
    .then(response => {
        console.log('📥 Réponse reçue:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📊 Données:', data);
        
        // Masquer progress
        if (progressSection) {
            progressSection.style.display = 'none';
        }
        
        if (data.success) {
            showNotification(`Import réussi! ${data.total_importes} utilisateur(s)`, "success");
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showNotification("Erreur: " + (data.error || "Inconnue"), "error");
        }
    })
    .catch(error => {
        console.error("💥 Erreur:", error);
        if (progressSection) {
            progressSection.style.display = 'none';
        }
        showNotification("Erreur de communication", "error");
    });
}

// ===== FORMULAIRE AJOUT MANUEL =====
document.addEventListener('submit', function(e) {
    if (e.target.id === 'userForm') {
        e.preventDefault();
        console.log('📝 Soumission formulaire utilisateur');
        
        const formData = new FormData(e.target);
        
        // Validation
        if (!formData.get('nom') || !formData.get('prenom')) {
            showNotification('Nom et prénom obligatoires', 'warning');
            return;
        }

        fetch('/ajouter-utilisateur', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                showNotification('Utilisateur ajouté avec succès', 'success');
                e.target.reset();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showNotification('Erreur: ' + (data.error || 'Inconnue'), 'error');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur lors de l\'ajout', 'error');
        });
    }
});

// ===== ACTIONS UTILISATEURS =====
function initUserActions() {
    // Bouton Actualiser
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Délégation d'événements pour les boutons du tableau
    document.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const userId = target.getAttribute('data-user-id');
        const userName = target.getAttribute('data-user-name');

        if (target.classList.contains('view-profile-btn')) {
            viewUserProfile(userId);
        } else if (target.classList.contains('edit-user-btn')) {
            editUser(userId);
        } else if (target.classList.contains('delete-user-btn')) {
            deleteUser(userId, userName);
        }
    });
}

// ===== FILTRES =====
function filterUsers() {
    const searchInput = document.getElementById('searchInput');
    const classeFilter = document.getElementById('classeFilter');
    const usersTable = document.getElementById('usersTable');
    
    if (!usersTable) return;
    
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const selectedClasse = classeFilter?.value || '';
    const rows = usersTable.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const userClasse = row.getAttribute('data-classe') || '';
        
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesClasse = !selectedClasse || userClasse === selectedClasse;
        
        row.style.display = matchesSearch && matchesClasse ? '' : 'none';
    });
}

// ===== MODALS =====
function initUserModals() {
    // Fermeture modals
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Fermeture en cliquant à l'extérieur
    window.addEventListener('click', function(e) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

// ===== FORMULAIRE DE MODIFICATION - VERSION CORRIGÉE =====
const editForm = document.getElementById('editUserForm');
if (editForm) {
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('📝 Soumission formulaire modification');
        
        const formData = new FormData(this);
        
        // Vérifier que user_id est présent
        const userId = formData.get('user_id');
        if (!userId) {
            showNotification('ID utilisateur manquant', 'error');
            return;
        }
        
        // Afficher les données pour debug
        console.log('📤 Données FormData:');
        for (let [key, value] of formData.entries()) {
            console.log(`   ${key}: ${value}`);
        }
        
        // ENVOI EN FORM-DATA (comme attendu par Flask)
        fetch('/modifier_utilisateur', {
            method: 'POST',
            body: formData
            // Pas de headers Content-Type - le navigateur gère ça automatiquement
        })
        .then(response => {
            console.log('📥 Statut HTTP:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            console.log('📊 Réponse:', result);
            if (result.success) {
                showNotification('✅ Utilisateur modifié avec succès', 'success');
                document.getElementById('editUserModal').style.display = 'none';
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showNotification('❌ Erreur: ' + (result.error || 'Inconnue'), 'error');
            }
        })
        .catch(error => {
            console.error('💥 Erreur:', error);
            showNotification('❌ Erreur de communication: ' + error.message, 'error');
        });
    });
}
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteUser);
    }

    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            document.getElementById('deleteUserModal').style.display = 'none';
        });
    }
}

// ===== FONCTIONS MODALS =====
function viewUserProfile(userId) {
    console.log('👁️ Voir profil:', userId);
    const modal = document.getElementById('profileModal');
    const content = document.getElementById('profileContent');
    
    if (content) {
        content.innerHTML = '<p>Chargement du profil...</p>';
    }
    
    if (modal) {
        modal.style.display = 'block';
        
        setTimeout(() => {
            if (content) {
                content.innerHTML = `
                    <div class="profile-info">
                        <h4>Profil de l'utilisateur #${userId}</h4>
                        <p>Fonctionnalité en cours de développement...</p>
                    </div>
                `;
            }
        }, 500);
    }
}

// ===== FONCTION EDITUSER AVEC CONVERSION DATE GMT =====

function editUser(userId) {
    console.log('✏️ Modifier utilisateur:', userId);
    
    // Trouver la ligne de l'utilisateur dans le tableau
    const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!userRow) {
        showMessage('Utilisateur non trouvé dans le tableau', 'error');
        return;
    }
    
    // Extraire les données depuis la ligne du tableau
    const cells = userRow.querySelectorAll('td');
    
    let nom = '', prenom = '', email = '', classe = '', dateNaissance = '', date_entree_bac ='', date_certification = '', specialite = '';
    
    try {
        // Nom complet dans la colonne 1
        const nomComplet = cells[1].querySelector('strong')?.textContent || '';
        const nomParts = nomComplet.split(' ');
        if (nomParts.length >= 2) {
            prenom = nomParts[0];
            nom = nomParts.slice(1).join(' ');
        }
        
        // Email dans la colonne 2
        email = cells[2].textContent.trim();
        
        // Classe dans la colonne 3
        const classeBadge = cells[3].querySelector('.badge-classe');
        classe = classeBadge ? classeBadge.textContent.trim() : cells[3].textContent.trim();
        
        // Date de naissance dans la colonne 4
        const naissanceBadge = cells[4].querySelector('.badge-naissance');
        if (naissanceBadge) {
            const dateText = naissanceBadge.textContent.trim();
            console.log('📅 Date brute extraite:', dateText);
            
            // Convertir la date GMT vers format YYYY-MM-DD
            dateNaissance = convertGMTToInputDate(dateText);
            console.log('📅 Date convertie:', dateNaissance);
        }
        
        if (cells.length >= 5) {
            date_entree_bac = cells[5].textContent.trim();
        }

        if (cells.length >= 6) {
            date_certification = cells[6].textContent.trim();
        }

        if (cells.length >= 7) {
            specialite = cells[7].textContent.trim();
        }

        console.log('📋 Données extraites:', { nom, prenom, email, classe, dateNaissance, date_entree_bac, date_certification, specialite });
        
    } catch (error) {
        console.error('❌ Erreur extraction données:', error);
        showMessage('Erreur lors de l\'extraction des données', 'error');
        return;
    }
    
    // Pré-remplir le formulaire
    const modal = document.getElementById('editUserModal');
    if (modal) {
        const fields = {
            'edit_nom': nom,
            'edit_prenom': prenom,
            'edit_email': email,
            'edit_classe': classe,
            'edit_date_naissance': dateNaissance,
            'edit_date_entree_bac': date_entree_bac,
            'edit_date_certification': date_certification,
            'edit_specialite': specialite,
            'edit_user_id': userId
        };
        
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value || '';
                console.log(`✏️ ${fieldId} = "${value}"`);
            } else {
                console.warn(`⚠️ Champ ${fieldId} non trouvé`);
            }
        });
        
        modal.style.display = 'block';
        console.log('✅ Modal affiché avec données pré-remplies');
    }
}

// ===== FONCTION CONVERSION DATE GMT VERS YYYY-MM-DD =====
function convertGMTToInputDate(gmtDateString) {
    try {
        // Cas spéciaux pour les formats courants
        if (!gmtDateString || gmtDateString === '-' || gmtDateString.trim() === '') {
            return '';
        }
        
        console.log('🔄 Conversion date GMT:', gmtDateString);
        
        // Si c'est déjà au bon format YYYY-MM-DD, on garde
        if (gmtDateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.log('✅ Date déjà au bon format');
            return gmtDateString;
        }
        
        // Créer un objet Date depuis la chaîne GMT
        const date = new Date(gmtDateString);
        
        // Vérifier que la date est valide
        if (isNaN(date.getTime())) {
            console.warn('⚠️ Date invalide:', gmtDateString);
            return '';
        }
        
        // Convertir au format YYYY-MM-DD (format attendu par input[type="date"])
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 car getMonth() commence à 0
        const day = String(date.getDate()).padStart(2, '0');
        
        const formattedDate = `${year}-${month}-${day}`;
        console.log('✅ Date convertie:', formattedDate);
        
        return formattedDate;
        
    } catch (error) {
        console.error('❌ Erreur conversion date:', error);
        return '';
    }
}


    // AJOUT: Gestion bouton suppression
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            console.log('🗑️ Confirmation suppression');
            
            const modal = this.closest('.modal');
            const userId = modal.dataset.userId; // On stockera l'ID dans le modal
            
            if (!userId) {
                showMessage('ID utilisateur manquant', 'error');
                return;
            }
            
            fetch('/supprimer_utilisateur', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: parseInt(userId) })
            })
            .then(response => response.json())
            .then(result => {
                console.log('📥 Réponse suppression:', result);
                if (result.success) {
                    showMessage('Utilisateur supprimé avec succès', 'success');
                    modal.style.display = 'none';
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showMessage('Erreur: ' + (result.error || 'Inconnue'), 'error');
                }
            })
            .catch(error => {
                console.error('💥 Erreur suppression:', error);
                showMessage('Erreur lors de la suppression', 'error');
            });
        });
    
}
    
function deleteUser(userId, userName) {
    console.log('🗑️ Supprimer utilisateur:', userId, userName);
    currentDeletingUserId = userId;
    
    const modal = document.getElementById('deleteUserModal');
    const textElement = document.getElementById('deleteConfirmationText');
    
    if (textElement) {
        textElement.textContent = `Êtes-vous sûr de vouloir supprimer "${userName}" ?`;
    }
    
    if (modal) {
        modal.style.display = 'block';
    }
}

function showDeleteUser(userId, userName) {
    console.log('🗑️ Supprimer utilisateur:', userId, userName);
    
    const modal = document.getElementById('deleteUserModal');
    const textElement = document.getElementById('deleteConfirmationText');
    
    if (textElement) {
        textElement.textContent = `Êtes-vous sûr de vouloir supprimer "${userName}" ?`;
    }
    
    if (modal) {
        // Stocker l'ID dans le modal pour le retrouver lors de la confirmation
        modal.dataset.userId = userId;
        modal.style.display = 'block';
    }
}

function submitEditForm() {
    if (!currentEditingUserId) return;
    
    const formData = new FormData(document.getElementById('editUserForm'));
    const data = Object.fromEntries(formData);
    data.user_id = currentEditingUserId;
    
    fetch('/modifier_utilisateur', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Utilisateur modifié avec succès', 'success');
            document.getElementById('editUserModal').style.display = 'none';
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification('Erreur: ' + result.error, 'error');
        }
    })
    .catch(error => {
        showNotification('Erreur de modification', 'error');
    });
}

function confirmDeleteUser() {
    if (!currentDeletingUserId) return;
    
    fetch('/supprimer_utilisateur', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: currentDeletingUserId })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Utilisateur supprimé avec succès', 'success');
            document.getElementById('deleteUserModal').style.display = 'none';
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification('Erreur: ' + result.error, 'error');
        }
    })
    .catch(error => {
        showNotification('Erreur de suppression', 'error');
    });
}

// ===== TÉLÉCHARGEMENT TEMPLATE =====
function downloadTemplate() {
    console.log('📥 Téléchargement template');
    
    const template = [
        ['nom', 'prenom', 'email', 'classe', 'date_naissance', 'date_entree_bac', 'date_certification', 'specialite'],
        ['Dupont', 'Jean', 'jean.dupont@test.fr', 'Terminale', '2005-03-15','2020','2024','BP CIEL'],
        ['Martin', 'Sophie', 'sophie.martin@test.fr', 'Première', '2006-07-22','2020','2024','BP CIEL']
    ];
    
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_utilisateurs.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Template téléchargé', 'success');
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    // Supprimer notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:white; cursor:pointer; margin-left:10px;">×</button>
    `;
    
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
        border-radius: 5px;
        color: white;
        z-index: 1000;
        background: ${colors[type] || colors.info};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

console.log('✅ Script.js chargé complètement');