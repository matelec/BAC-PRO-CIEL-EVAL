// ===== EVALUATIONS.JS - MODULE GESTION EVALUATIONS =====
console.log('👥 MODULE EVALUATIONS CHARGÉ');

class EvaluationsModule {
    constructor() {
        this.currentEditingUserId = null;
        this.currentDeletingUserId = null;
        this.filteredUsers = [];
        
        this.init();
    }

    init() {
        console.log('🔧 Initialisation module evaluations...');
        
        // Vérifier si on est sur la bonne page
        if (!document.querySelector('.evaluations-page')) {
            console.log('⚠️ Page evaluations non détectée');
            return;
        }

        this.initToggleButtons();
//        this.initUserActions();
//        this.initUserModals();
//        this.initFilters();
//        this.initFileUpload();
        
        console.log('✅ Module evaluations initialisé');
    }

    // ===== BOUTONS TOGGLE =====
    initToggleButtons() {
        console.log('🔘 Initialisation boutons toggle...');

        const toggleAjoutEvalBtn = document.getElementById('toggleAjoutEvalBtn');
        const ajoutEval = document.getElementById('ajoutEval');

        if (!toggleAjoutEvalBtn) {
        console.error('❌ Boutons toggle non trouvés');
        return;
        }


    // Masquer toutes les sections
    const hideAllSections = () => {
        if (ajoutEval) {
            ajoutEval.style.display = 'none';
            ajoutEval.classList.remove('active');
        }
        toggleAjoutEvalBtn.classList.remove('active');
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
    };    


     // Événements
    toggleAjoutEvalBtn.addEventListener('click', () => {
        console.log('🖱️ Clic bouton Ajout Evalaluations');
        if (!ajoutEval || ajoutEval.style.display === 'none') {
            showSection(ajoutEval, toggleAjoutEvalBtn);
        } else {
            hideAllSections();
        }
    });
        
        console.log('✅ Boutons toggle configurés');
    }
}        

// Exposer le module globalement
window.EvaluationsModule = EvaluationsModule;

console.log('✅ Module evaluations chargé');