// ===== INITIALISATION GÉNÉRALE =====
document.addEventListener('DOMContentLoaded', function() {
    initUsersManagement();
    initGeneralComponents();
    console.log('🚀 Application BAC PRO CIEL initialisée');
});

function initGeneralComponents() {
    // Initialiser les composants généraux si nécessaires
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
    
    const classeFilter = document.getElementById('classeFilter');
    if (classeFilter) {
        classeFilter.addEventListener('change', filterUsers);
    }
}

// ===== GESTION DES UTILISATEURS =====
function initUsersManagement() {
    initImportSection();
    initUserActions();
    initUserModals();
}

// ===== SECTIONS AJOUT/IMPORT =====
function initImportSection() {
    const importSection = document.getElementById('importSection');
    const ajoutSection = document.getElementById('ajoutSection');
    const toggleImportBtn = document.getElementById('toggleImportBtn');
    const toggleAjoutBtn = document.getElementById('toggleAjoutBtn');

    if (!toggleImportBtn || !toggleAjoutBtn) return;

    function hideAllSections() {
        if (importSection) importSection.style.display = 'none';
        if (ajoutSection) ajoutSection.style.display = 'none';
        toggleImportBtn.classList.remove('active');
        toggleAjoutBtn.classList.remove('active');
    }

    function showSection(section, button) {
        hideAllSections();
        if (section) {
            section.style.display = 'block';
            section.classList.add('active');
        }
        if (button) {
            button.classList.add('active');
        }
    }

    // Bouton Import Excel
    toggleImportBtn.addEventListener('click', function() {
        if (importSection.style.display === 'none') {
            showSection(importSection, this);
        } else {
            hideAllSections();
        }
    });

    // Bouton Ajout manuel
    toggleAjoutBtn.addEventListener('click', function() {
        if (ajoutSection.style.display === 'none') {
            showSection(ajoutSection, this);
        } else {
            hideAllSections();
        }
    });

    // Gestion upload fichier
    initFileUpload();
    
    // Gestion formulaire ajout manuel
    initManualForm();
}

function initFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const excelFile = document.getElementById('excelFile');
    const chooseFileBtn = document.getElementById('chooseFileBtn');

    if (!uploadArea || !excelFile) return;

    // Click sur zone d'upload
    uploadArea.addEventListener('click', function(e) {
        if (e.target !== chooseFileBtn) {
            excelFile.click();
        }
    });

    // Drag and drop
    ['dragover', 'dragenter'].forEach(event => {
        uploadArea.addEventListener(event, function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
    });

    ['dragleave', 'dragend', 'drop'].forEach(event => {
        uploadArea.addEventListener(event, function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
    });

    uploadArea.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // Sélection fichier
    excelFile.addEventListener('change', function(e) {
        if (this.files.length > 0) {
            handleFileSelect(this.files[0]);
        }
    });

    // Téléchargement template
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', downloadTemplate);
    }
}

function handleFileSelect(file) {
    if (!file) return;
    
    const progressSection = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressSection) progressSection.style.display = 'block';
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = 'Traitement du fichier...';
    
    // Simulation progression
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (progressFill) progressFill.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            if (progressText) progressText.textContent = 'Fichier traité avec succès !';
            setTimeout(() => {
                if (progressSection) progressSection.style.display = 'none';
                showNotification('Utilisateurs importés avec succès', 'success');
                // Recharger la page après import
                setTimeout(() => window.location.reload(), 1000);
            }, 1000);
        }
    }, 200);
}

function downloadTemplate() {
    showNotification('Template téléchargé', 'info');
    // Logique de téléchargement à implémenter
}

function initManualForm() {
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitManualUserForm();
        });
    }
}

function submitManualUserForm() {
    const form = document.getElementById('userForm');
    const formData = new FormData(form);

    // Validation
    if (!formData.get('nom') || !formData.get('prenom') || !formData.get('email')) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
        return;
    }

    fetch('/ajouter-utilisateur', {
        method: 'POST',
        body: formData   // ⚠️ envoi direct, pas besoin de headers JSON
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            showNotification('Utilisateur ajouté avec succès', 'success');
            form.reset();
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


// ===== ACTIONS UTILISATEURS =====
function initUserActions() {
    // Bouton Actualiser
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Boutons du tableau
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-profile-btn')) {
            const btn = e.target.closest('.view-profile-btn');
            const userId = btn.getAttribute('data-user-id');
            viewUserProfile(userId);
        }
        
        if (e.target.closest('.edit-user-btn')) {
            const btn = e.target.closest('.edit-user-btn');
            const userId = btn.getAttribute('data-user-id');
            editUser(userId);
        }
        
        if (e.target.closest('.delete-user-btn')) {
            const btn = e.target.closest('.delete-user-btn');
            const userId = btn.getAttribute('data-user-id');
            const userName = btn.getAttribute('data-user-name');
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
    
    // Formulaire d'édition
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitEditForm();
        });
    }
    
    // Bouton d'annulation édition
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            document.getElementById('editUserModal').style.display = 'none';
        });
    }
    
    // Confirmation suppression
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteUser);
    }
    
    // Annulation suppression
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            document.getElementById('deleteUserModal').style.display = 'none';
        });
    }
}

let currentEditingUserId = null;
let currentDeletingUserId = null;

function viewUserProfile(userId) {
    const modal = document.getElementById('profileModal');
    const content = document.getElementById('profileContent');
    
    content.innerHTML = '<p>Chargement du profil...</p>';
    modal.style.display = 'block';
    
    setTimeout(() => {
        content.innerHTML = `
            <div class="profile-info">
                <h4>Profil de l'utilisateur #${userId}</h4>
                <p>Fonctionnalité en cours de développement...</p>
            </div>
        `;
    }, 500);
}

function editUser(userId) {
    currentEditingUserId = userId;
    const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
    
    if (!userRow) {
        showNotification('Utilisateur non trouvé', 'error');
        return;
    }
    
    // Remplir le formulaire (à adapter selon votre structure)
    document.getElementById('editUserModal').style.display = 'block';
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

function deleteUser(userId, userName) {
    currentDeletingUserId = userId;
    const textElement = document.getElementById('deleteConfirmationText');
    
    if (textElement) {
        textElement.textContent = `Êtes-vous sûr de vouloir supprimer "${userName}" ?`;
    }
    
    document.getElementById('deleteUserModal').style.display = 'block';
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

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:white; cursor:pointer; font-size:16px;">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const colors = {
        'success': '#27ae60',
        'error': '#e74c3c', 
        'warning': '#f39c12',
        'info': '#3498db'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}