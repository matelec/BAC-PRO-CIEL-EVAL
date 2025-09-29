// ===== USERS.JS - MODULE GESTION UTILISATEURS =====
console.log('👥 MODULE UTILISATEURS CHARGÉ');

class UsersModule {
    constructor() {
        this.currentEditingUserId = null;
        this.currentDeletingUserId = null;
        this.filteredUsers = [];
        
        this.init();
    }

    init() {
        console.log('🔧 Initialisation module utilisateurs...');
        
        // Vérifier si on est sur la bonne page
        if (!document.querySelector('.users-management')) {
            console.log('⚠️ Page utilisateurs non détectée');
            return;
        }

        this.initToggleButtons();
        this.initUserActions();
        this.initUserModals();
        this.initFilters();
        this.initFileUpload();
        
        console.log('✅ Module utilisateurs initialisé');
    }

    // ===== BOUTONS TOGGLE =====
    initToggleButtons() {
        console.log('🔘 Initialisation boutons toggle...');
        
        const toggleImportBtn = document.getElementById('toggleImportBtn');
        const toggleAjoutBtn = document.getElementById('toggleAjoutBtn');
        const importSection = document.getElementById('importSection');
        const ajoutSection = document.getElementById('ajoutSection');

        if (!toggleImportBtn || !toggleAjoutBtn) {
            console.error('❌ Boutons toggle non trouvés');
            return;
        }

        // Masquer toutes les sections
        const hideAllSections = () => {
            if (importSection) {
                importSection.style.display = 'none';
                importSection.classList.remove('active');
            }
            if (ajoutSection) {
                ajoutSection.style.display = 'none';
                ajoutSection.classList.remove('active');
            }
            toggleImportBtn.classList.remove('active');
            toggleAjoutBtn.classList.remove('active');
        };

        // Afficher une section
        const showSection = (section, button) => {
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
                    this.initFileUpload();
                }, 100);
            }
        };

        // Événements
        toggleImportBtn.addEventListener('click', () => {
            console.log('🖱️ Clic bouton Import Excel');
            if (!importSection || importSection.style.display === 'none') {
                showSection(importSection, toggleImportBtn);
            } else {
                hideAllSections();
            }
        });

        toggleAjoutBtn.addEventListener('click', () => {
            console.log('🖱️ Clic bouton Ajout manuel');
            if (!ajoutSection || ajoutSection.style.display === 'none') {
                showSection(ajoutSection, toggleAjoutBtn);
            } else {
                hideAllSections();
            }
        });

        console.log('✅ Boutons toggle configurés');
    }

    // ===== UPLOAD FICHIER =====
initFileUpload() {
    console.log('📁 Initialisation upload fichier...');
    
    const uploadArea = document.getElementById('uploadArea');
    const excelFile = document.getElementById('excelFile');
    const chooseFileBtn = document.getElementById('chooseFileBtn');

    if (!uploadArea || !excelFile) {
        console.error('❌ Éléments upload non trouvés');
        return;
    }

    // Supprimer les anciens écouteurs pour éviter les doublons
    uploadArea.replaceWith(uploadArea.cloneNode(true));
    excelFile.replaceWith(excelFile.cloneNode(true));
    if (chooseFileBtn) chooseFileBtn.replaceWith(chooseFileBtn.cloneNode(true));
    
    // Référencer à nouveau les éléments après le clone
    const newUploadArea = document.getElementById('uploadArea');
    const newExcelFile = document.getElementById('excelFile');
    const newChooseFileBtn = document.getElementById('chooseFileBtn');

    let clickInProgress = false;

    // Événement bouton choisir fichier
    if (newChooseFileBtn) {
        newChooseFileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Clic bouton choisir fichier');
            
            if (!clickInProgress) {
                clickInProgress = true;
                newExcelFile.click();
                setTimeout(() => { clickInProgress = false; }, 100);
            }
        });
    }

    // Événement clic sur zone upload - AVEC ANTI-REBOND
    newUploadArea.addEventListener('click', (e) => {
        console.log('🖱️ Clic zone upload');
        
        if (clickInProgress) {
            console.log('⏳ Clic déjà en cours - ignoré');
            return;
        }
        
        clickInProgress = true;
        
        // Ignorer les clics sur le bouton
        if (e.target === newChooseFileBtn || e.target.closest('#chooseFileBtn')) {
            console.log('👉 Clic sur bouton - ignoré');
            clickInProgress = false;
            return;
        }
        
        console.log('📁 Ouverture sélecteur de fichier...');
        newExcelFile.click();
        
        // Réinitialiser après un court délai
        setTimeout(() => {
            clickInProgress = false;
        }, 100);
    });

    // Événement change
    newExcelFile.addEventListener('change', (e) => {
        console.log('🎯 ÉVÉNEMENT CHANGE DÉCLENCHÉ !');
        console.log('📁 Fichiers:', e.target.files);
        
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            console.log('✅ Fichier sélectionné:', file.name);
            this.handleFileSelect(file);
        }
    });


        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            console.log('📦 Drag over');
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            console.log('📦 Drag leave');
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            console.log('📦 Fichiers droppés:', files.length);
            
            if (files.length > 0) {
                const file = files[0];
                console.log('📁 Fichier droppé:', {
                    name: file.name,
                    size: file.size,
                    type: file.type
                });
                this.handleFileSelect(file);
                
                // Mettre à jour l'input file avec le fichier droppé
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                excelFile.files = dataTransfer.files;
            }
        });

        console.log('✅ Upload configuré');
    }

    // Gestion de fichier
    handleFileSelect(file) {
        console.log('📁 handleFileSelect appelé:', file.name);
        
        if (!file) {
            console.error('❌ Aucun fichier');
            return;
        }

        // Validations
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            app.showNotification("Format non supporté. Utilisez .xlsx ou .xls", "error");
            return;
        }
        
        if (file.size === 0) {
            app.showNotification("Le fichier est vide", "error");
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            app.showNotification("Fichier trop volumineux (max 10MB)", "error");
            return;
        }

        console.log('✅ Fichier valide, envoi...');
        this.uploadFile(file);
    }

    // Upload du fichier
    async uploadFile(file) {
        const progressSection = document.getElementById('uploadProgress');
        if (progressSection) {
            progressSection.style.display = 'block';
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/import-utilisateurs", {
                method: "POST",
                body: formData
            });

            console.log('📥 Réponse reçue:', response.status);
            const data = await response.json();
            console.log('📊 Données:', data);
            
            if (progressSection) {
                progressSection.style.display = 'none';
            }
            
            if (data.success) {
                app.showNotification(`Import réussi! ${data.total_importes} utilisateur(s)`, "success");
                setTimeout(() => window.location.reload(), 2000);
            } else {
                app.showNotification("Erreur: " + (data.error || "Inconnue"), "error");
            }
        } catch (error) {
            console.error("💥 Erreur:", error);
            if (progressSection) {
                progressSection.style.display = 'none';
            }
            app.showNotification("Erreur de communication", "error");
        }
    }

    // ===== ACTIONS UTILISATEURS =====
    initUserActions() {
        // Bouton Actualiser
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }

        // Formulaire ajout utilisateur
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddUser(e.target);
            });
        }

        // Délégation d'événements pour les boutons du tableau
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const userId = target.getAttribute('data-user-id');
            const userName = target.getAttribute('data-user-name');

            if (target.classList.contains('view-profile-btn')) {
                this.viewUserProfile(userId);
            } else if (target.classList.contains('edit-user-btn')) {
                this.editUser(userId);
            } else if (target.classList.contains('delete-user-btn')) {
                this.deleteUser(userId, userName);
            }
        });
    }

    // Ajout d'utilisateur
    async handleAddUser(form) {
        console.log('📝 Soumission formulaire utilisateur');
        
        const validation = app.validateForm(form);
        if (!validation.isValid) {
            app.showNotification(validation.errors[0], 'warning');
            return;
        }

        const formData = new FormData(form);
        
        try {
            const response = await fetch('/ajouter-utilisateur', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.id) {
                app.showNotification('Utilisateur ajouté avec succès', 'success');
                form.reset();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                app.showNotification('Erreur: ' + (data.error || 'Inconnue'), 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            app.showNotification('Erreur lors de l\'ajout', 'error');
        }
    }

    // ===== MODALS =====
    initUserModals() {
        // Formulaire de modification
        const editForm = document.getElementById('editUserForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditUser(e.target);
            });
        }
        
        // Boutons de confirmation/annulation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confirmDeleteUser();
            });
        }

        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                app.closeModal(document.getElementById('deleteUserModal'));
            });
        }
    }

    // Voir profil utilisateur
    viewUserProfile(userId) {
        console.log('👁️ Voir profil:', userId);
        const modal = document.getElementById('profileModal');
        const content = document.getElementById('profileContent');
        
        if (content) {
            content.innerHTML = '<p>Chargement du profil...</p>';
        }
        
        app.openModal('profileModal');
        
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

    // Modifier utilisateur
    editUser(userId) {
        console.log('✏️ Modifier utilisateur:', userId);
        
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (!userRow) {
            app.showNotification('Utilisateur non trouvé dans le tableau', 'error');
            return;
        }
        
        // Extraire les données depuis la ligne
        const cells = userRow.querySelectorAll('td');
        
        try {
            // Nom complet dans la colonne 1
            const nomComplet = cells[1].querySelector('strong')?.textContent || '';
            const nomParts = nomComplet.split(' ');
            const prenom = nomParts[0] || '';
            const nom = nomParts.slice(1).join(' ') || '';
            
            // Autres données
            const email = cells[2].textContent.trim();
            const classe = cells[3].querySelector('.badge-classe')?.textContent.trim() || cells[3].textContent.trim();
            
            // Date de naissance (conversion GMT vers YYYY-MM-DD)
            const naissanceBadge = cells[4].querySelector('.badge-naissance');
            let dateNaissance = '';
            if (naissanceBadge) {
                const dateText = naissanceBadge.textContent.trim();
                dateNaissance = this.convertGMTToInputDate(dateText);
            }
            
            const date_entree_bac = cells.length >= 6 ? cells[5].textContent.trim() : '';
            const date_certification = cells.length >= 7 ? cells[6].textContent.trim() : '';
            const specialite = cells.length >= 8 ? cells[7].textContent.trim() : '';

            // Pré-remplir le formulaire
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
                }
            });
            
            app.openModal('editUserModal');
            
        } catch (error) {
            console.error('❌ Erreur extraction données:', error);
            app.showNotification('Erreur lors de l\'extraction des données', 'error');
        }
    }

    // Conversion date GMT vers YYYY-MM-DD
    convertGMTToInputDate(gmtDateString) {
        try {
            if (!gmtDateString || gmtDateString === '-' || gmtDateString.trim() === '') {
                return '';
            }
            
            // Si c'est déjà au bon format
            if (gmtDateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return gmtDateString;
            }
            
            const date = new Date(gmtDateString);
            if (isNaN(date.getTime())) {
                return '';
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
            
        } catch (error) {
            console.error('❌ Erreur conversion date:', error);
            return '';
        }
    }

    // Traitement modification utilisateur
    async handleEditUser(form) {
        console.log('📝 Soumission formulaire modification');
        
        const formData = new FormData(form);
        const userId = formData.get('user_id');
        
        if (!userId) {
            app.showNotification('ID utilisateur manquant', 'error');
            return;
        }
        
        try {
            const response = await fetch('/modifier_utilisateur', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                app.showNotification('✅ Utilisateur modifié avec succès', 'success');
                app.closeModal(document.getElementById('editUserModal'));
                setTimeout(() => window.location.reload(), 1000);
            } else {
                app.showNotification('❌ Erreur: ' + (result.error || 'Inconnue'), 'error');
            }
        } catch (error) {
            console.error('💥 Erreur:', error);
            app.showNotification('❌ Erreur de communication: ' + error.message, 'error');
        }
    }

    // Supprimer utilisateur
    deleteUser(userId, userName) {
        console.log('🗑️ Supprimer utilisateur:', userId, userName);
        this.currentDeletingUserId = userId;
        
        const modal = document.getElementById('deleteUserModal');
        const textElement = document.getElementById('deleteConfirmationText');
        
        if (textElement) {
            textElement.textContent = `Êtes-vous sûr de vouloir supprimer "${userName}" ?`;
        }
        
        app.openModal('deleteUserModal');
    }

    // Confirmation suppression
    async confirmDeleteUser() {
        if (!this.currentDeletingUserId) return;
        
        try {
            const response = await fetch('/supprimer_utilisateur', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ user_id: this.currentDeletingUserId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                app.showNotification('Utilisateur supprimé avec succès', 'success');
                app.closeModal(document.getElementById('deleteUserModal'));
                setTimeout(() => window.location.reload(), 1000);
            } else {
                app.showNotification('Erreur: ' + result.error, 'error');
            }
        } catch (error) {
            app.showNotification('Erreur de suppression', 'error');
        }
    }

    // ===== FILTRES =====
    initFilters() {
        const searchInput = document.getElementById('searchInput');
        const classeFilter = document.getElementById('classeFilter');
        
        if (searchInput) {
            // Vérifier que app est disponible avant d'utiliser debounce
            const debounceFunc = app && typeof app.debounce === 'function' 
                ? app.debounce 
                : this.fallbackDebounce;
                
            searchInput.addEventListener('input', debounceFunc(() => {
                this.filterUsers();
            }, 300));
        }
        
        if (classeFilter) {
            classeFilter.addEventListener('change', () => {
                this.filterUsers();
            });
        }
    }

    // Fallback si app.debounce n'est pas disponible
    fallbackDebounce(func, wait) {
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

    filterUsers() {
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

   
}

// Exposer le module globalement
window.UsersModule = UsersModule;

console.log('✅ Module utilisateurs chargé');