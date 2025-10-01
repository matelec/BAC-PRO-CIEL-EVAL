// passage_classe.js
console.log('📄 Script passage_classe.js chargé');

let previewData = [];
let archivesData = [];
let statsData = [];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation passage de classe');
    chargerPreview();
    chargerArchives();
    chargerStats();
});

// ===== GESTION DES ONGLETS =====
function switchTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ===== CHARGEMENT DES DONNÉES =====
async function chargerPreview() {
    console.log('📊 Chargement preview...');
    try {
        const response = await fetch('/api/passage-classe/preview');
        const data = await response.json();
        previewData = data;
        afficherPreview(data);
        
        // Activer le bouton si des élèves sont concernés
        const btnPassage = document.getElementById('btn-passage');
        if (data && data.length > 0) {
            btnPassage.disabled = false;
        }
    } catch (error) {
        console.error('Erreur chargement preview:', error);
        document.getElementById('preview-container').innerHTML = 
            '<div class="error">Erreur lors du chargement de l\'aperçu</div>';
    }
}

function afficherPreview(data) {
    const container = document.getElementById('preview-container');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Aucun élève à faire passer actuellement</p>';
        return;
    }
    
    let html = '';
    data.forEach(item => {
        const isArchive = item.destination === 'Archives';
        const cardClass = isArchive ? 'archive' : 'passage';
        const icon = isArchive ? '🗄️' : '⬆️';
        
        html += `
            <div class="preview-card ${cardClass}">
                <div>
                    <h3>${icon} Classe de ${item.classe_actuelle}</h3>
                    <p>${item.nb_eleves} élève(s) • ${item.nb_validations_total} validation(s)</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 24px;">→</div>
                    <div style="font-weight: 600; color: ${isArchive ? '#e74c3c' : '#3498db'};">
                        ${item.destination}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function chargerArchives() {
    console.log('📚 Chargement archives...');
    try {
        const response = await fetch('/api/passage-classe/archives');
        const data = await response.json();
        archivesData = data.archives || [];
        afficherArchives(archivesData);
    } catch (error) {
        console.error('Erreur chargement archives:', error);
        document.getElementById('archives-container').innerHTML = 
            '<div class="error">Erreur lors du chargement des archives</div>';
    }
}

function afficherArchives(archives) {
    const container = document.getElementById('archives-container');
    
    if (!archives || archives.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Aucun élève archivé</p>';
        return;
    }
    
    let html = '';
    archives.forEach(archive => {
        const dateArchivage = new Date(archive.date_archivage).toLocaleDateString('fr-FR');
        html += `
            <div class="archive-item">
                <div>
                    <div style="font-weight: 600;">${archive.prenom} ${archive.nom}</div>
                    <div style="color: #666; font-size: 14px;">
                        ${archive.email} • Diplômé en ${archive.annee_diplome}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600;">${archive.nb_validations} validations</div>
                    <div style="color: #666; font-size: 12px;">Archivé le ${dateArchivage}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function chargerStats() {
    console.log('📊 Chargement statistiques...');
    try {
        const response = await fetch('/api/passage-classe/archives/stats');
        const data = await response.json();
        statsData = data;
        afficherStats(data);
    } catch (error) {
        console.error('Erreur chargement stats:', error);
        document.getElementById('stats-container').innerHTML = 
            '<div class="error">Erreur lors du chargement des statistiques</div>';
    }
}

function afficherStats(stats) {
    const container = document.getElementById('stats-container');
    
    if (!stats || stats.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Aucune statistique disponible</p>';
        return;
    }
    
    let html = '';
    stats.forEach(stat => {
        const dateArchive = new Date(stat.premiere_archive).toLocaleDateString('fr-FR');
        html += `
            <div class="stat-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3>Promotion ${stat.annee_diplome}</h3>
                        <p style="margin: 0;">${stat.nb_diplomes} diplômé(s)</p>
                    </div>
                    <button class="btn-export" onclick="exporterArchives(${stat.annee_diplome})">
                        📥 Exporter
                    </button>
                </div>
                <div class="stat-grid">
                    <div class="stat-item">
                        <div style="font-size: 12px; opacity: 0.9;">Moyenne validations</div>
                        <div style="font-size: 24px; font-weight: 700;">${stat.moyenne_validations}</div>
                    </div>
                    <div class="stat-item">
                        <div style="font-size: 12px; opacity: 0.9;">Période d'archivage</div>
                        <div style="font-size: 14px; font-weight: 600;">${dateArchive}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ===== PASSAGE DE CLASSE =====
function confirmerPassage() {
    const terminaleInfo = previewData.find(p => p.classe_actuelle === 'Terminale');
    const premiereInfo = previewData.find(p => p.classe_actuelle === 'Première');
    
    let details = '<div style="margin: 20px 0;">';
    
    if (terminaleInfo) {
        details += `
            <div style="padding: 15px; background: #fee; border: 1px solid #fcc; border-radius: 6px; margin-bottom: 10px;">
                <strong>📦 Archivage des Terminales</strong><br>
                ${terminaleInfo.nb_eleves} élève(s) de Terminale seront archivés avec leurs ${terminaleInfo.nb_validations_total} validation(s)
            </div>
        `;
    }
    
    if (premiereInfo) {
        details += `
            <div style="padding: 15px; background: #e3f2fd; border: 1px solid #90caf9; border-radius: 6px;">
                <strong>⬆️ Passage Première → Terminale</strong><br>
                ${premiereInfo.nb_eleves} élève(s) de Première passeront en Terminale avec leurs ${premiereInfo.nb_validations_total} validation(s)
            </div>
        `;
    }
    
    details += `
        <div style="padding: 15px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; margin-top: 10px;">
            ✅ Les données des élèves archivés restent consultables<br>
            ✅ Toutes les validations sont conservées dans la base<br>
            ✅ Possibilité de restaurer un élève si besoin
        </div>
    </div>`;
    
    document.getElementById('modal-details').innerHTML = details;
    document.getElementById('modal-confirm').style.display = 'block';
}

function fermerModal() {
    document.getElementById('modal-confirm').style.display = 'none';
}

async function executerPassage() {
    console.log('🔄 Exécution du passage...');
    
    // Désactiver le bouton
    const btnConfirm = event.target;
    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Traitement en cours...';
    
    try {
        const response = await fetch('/api/passage-classe/passage-avec-archivage', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        fermerModal();
        
        if (result.success) {
            afficherNotification(result.message, 'success');
            // Recharger les données
            setTimeout(() => {
                chargerPreview();
                chargerArchives();
                chargerStats();
            }, 1000);
        } else {
            afficherNotification(result.error || 'Erreur lors du passage', 'error');
        }
    } catch (error) {
        console.error('Erreur passage:', error);
        afficherNotification('Erreur de connexion au serveur', 'error');
        fermerModal();
    } finally {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'Confirmer le passage';
    }
}

// ===== RECHERCHE =====
async function rechercherArchives() {
    const searchTerm = document.getElementById('search-input').value.trim();
    
    if (!searchTerm) {
        chargerArchives();
        return;
    }
    
    console.log('🔍 Recherche:', searchTerm);
    
    try {
        const response = await fetch(`/api/passage-classe/archives/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        afficherArchives(data);
    } catch (error) {
        console.error('Erreur recherche:', error);
        afficherNotification('Erreur lors de la recherche', 'error');
    }
}

// ===== EXPORT =====
function exporterArchives(annee = null) {
    console.log('📥 Export archives', annee ? `année ${annee}` : 'toutes');
    
    const url = annee 
        ? `/api/passage-classe/archives/export?annee=${annee}`
        : '/api/passage-classe/archives/export';
    
    window.location.href = url;
    afficherNotification('Export en cours...', 'info');
}

// ===== NOTIFICATIONS =====
function afficherNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    const colors = {
        'success': '#d4edda',
        'error': '#f8d7da',
        'warning': '#fff3cd',
        'info': '#d1ecf1'
    };
    
    const borderColors = {
        'success': '#c3e6cb',
        'error': '#f5c6cb',
        'warning': '#ffeaa7',
        'info': '#d1ecf1'
    };
    
// Appliquer les styles et afficher la notification
    notification.innerHTML = `${icons[type] || icons.info} ${message}`;
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.style.border = `1px solid ${borderColors[type] || borderColors.info}`;
    notification.style.color = type === 'success' ? '#155724' : 
                              type === 'error' ? '#721c24' : 
                              type === 'warning' ? '#856404' : '#0c5460';
    notification.style.display = 'block';
    
    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Gestionnaire d'événement pour la touche Entrée dans la recherche
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                rechercherArchives();
            }
        });
    }
});    
