// Variables globales pour les graphiques
let radarChartInstance = null;
let barChartInstance = null;
let typeBilan = 'intermediaire'; // ou 'final' selon la page

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Bouton de génération du rapport
    const generateReportBtn = document.getElementById('generateReport');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            const userId = document.getElementById('userSelector').value;
            if (!userId) {
                alert('Veuillez sélectionner un élève');
                return;
            }
            
            generateBilan(userId);
        });
    }

    // Bouton d'export PDF
    const exportPdfBtn = document.getElementById('exportPDF');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            exportToPDF();
        });
    }

    // Bouton d'export Excel (s'il existe)
    const exportExcelBtn = document.getElementById('exportExcel');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            exportToExcel();
        });
    }
}

/**
 * Génère le bilan pour un utilisateur spécifique
 */
async function generateBilan(userId) {
    try {
        showLoadingState(true);
        
        console.log('🔄 Début génération bilan pour user ID:', userId);

        const response = await fetch(`/api/utilisateur/${userId}/profil`);
        const data = await response.json();
        
        console.log('📥 Données reçues:', data);
        console.log('📊 Status response:', response.status);
        console.log('✅ Response ok:', response.ok);

        if (response.ok) {
            // AFFICHAGE COMPLET DES DONNÉES POUR DÉBOGAGE
            console.log('🔍 Structure complète des données:', JSON.stringify(data, null, 2));
            
            // Extraction des données selon différentes structures possibles
            let userData, competencesData;
            
            // Structure 1: {user: {...}, competences: [...]}
            if (data.user && data.competences) {
                console.log('📋 Structure 1 détectée: user + competences');
                userData = data.user;
                competencesData = data.competences;
            }
            // Structure 2: données directes
            else if (data.nom && data.prenom) {
                console.log('📋 Structure 2 détectée: données directes');
                userData = data;
                competencesData = data.competences || [];
            }
            // Structure 3: autre format
            else {
                console.warn('⚠️ Structure de données non standard:', data);
                userData = data;
                competencesData = data.competences || data.compétences || [];
            }
            
            console.log('👤 Données utilisateur:', userData);
            console.log('📊 Compétences:', competencesData);
            console.log('📈 Nombre de compétences:', competencesData.length);
            
            // Affichage des données
            displayProfile(userData);
            displayCompetences(competencesData);
            
            // Création des graphiques seulement si on a des données
            if (competencesData && competencesData.length > 0) {
                createCharts(competencesData);
            } else {
                console.warn('❌ Aucune donnée de compétences à afficher');
            }
            
            document.getElementById('bilanContent').style.display = 'block';
            
            // Scroll vers les résultats
            document.getElementById('bilanContent').scrollIntoView({ 
                behavior: 'smooth' 
            });
            
            console.log('✅ Bilan généré avec succès');
            
        } else {
            console.error('❌ Erreur response:', data);
            alert('Erreur lors du chargement des données: ' + (data.error || `Status ${response.status}`));
        }
    } catch (error) {
        console.error('💥 Erreur:', error);
        alert('Erreur lors de la génération du bilan: ' + error.message);
    } finally {
        showLoadingState(false);
    }
}

/**
 * Affiche l'état de chargement
 */
function showLoadingState(loading) {
    const button = document.getElementById('generateReport');
    if (button) {
        if (loading) {
            button.innerHTML = '<span class="loading-spinner"></span> Chargement...';
            button.disabled = true;
        } else {
            button.textContent = 'Générer le rapport';
            button.disabled = false;
        }
    }
}

/**
 * Affiche les informations du profil utilisateur
 */
function displayProfile(user) {
    const profileName = document.getElementById('profileName');
    const profileClasse = document.getElementById('profileClasse');
    const profileEmail = document.getElementById('profileEmail');
    const profileSpecialite = document.getElementById('profileSpecialite');
    const reportDate = document.getElementById('reportDate');
    
    if (profileName) profileName.textContent = `${user.prenom} ${user.nom}`;
    if (profileClasse) profileClasse.textContent = user.classe || 'Non spécifiée';
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileSpecialite) profileSpecialite.textContent = user.specialite || 'BAC PRO CIEL';

    // Ajout de la date de génération
    if (reportDate) {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        reportDate.textContent = now.toLocaleDateString('fr-FR', options);
    }

}

/**
 * Détermine la classe CSS pour une compétence spécifique
 */
function getCompetenceColorClass(competenceCode) {
    if (!competenceCode) return '';
    
    // Définition des groupes de compétences
    // Compétences en ORANGE
    const orangeCompetences = ['C01', 'C04', 'C08'];
    // Compétences en VERT
    const greenCompetences = ['C03', 'C07', 'C11'];
    // Compétences restantes (C06, C09, C10) seront aussi en bleu
    const bleuCompetences = ['C06', 'C09', 'C10'];

    if (orangeCompetences.includes(competenceCode)) {
        return 'competence-orange';
    } else if (greenCompetences.includes(competenceCode)) {
        return 'competence-green';
    } else if (bleuCompetences.includes(competenceCode)) {
        return 'competence-bleu';
    }
    
    return ''; // Pas de couleur spécifique
}

/**
 * Détermine la classe CSS pour le statut
 */
function getStatusClass(statut) {
    // Normaliser le statut (enlever accents, mettre en minuscule)
    const statutNormalise = statut.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    switch(statutNormalise) {
        case 'maitrise':
        case 'maîtrisé':
        case 'maitrisé':
            return 'status-mastered';
        case 'en cours':
            return 'status-in-progress';
        case 'a travailler':
        case 'à travailler':
            return 'status-to-work';
        case 'non evalue':
        case 'non évalué':
        case 'non evaluee':
        case 'non évaluée':
            return 'status-not-evaluated';
        default:
            return 'status-not-evaluated';
    }
}


/**
 * Affiche le tableau des compétences
 */
function displayCompetences(competences) {
    const tbody = document.getElementById('competenceTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let totalMaitrisees = 0;
    let totalPoints = 0;
    let totalValidations = 0;
    let competencesEvaluees = 0;
    
    competences.forEach(comp => {
        const row = document.createElement('tr');
        
        // Calcul des statistiques globales
        if (comp.nb_validations > 0) {
            competencesEvaluees++;
            totalPoints += comp.total_niveaux || 0;
            totalValidations += comp.nb_validations;
        }
        
        // Déterminer le statut correct
        let statut = comp.statut;
        
        if (!statut) {
            const niveauMoyen = comp.niveau_moyen || 0;
            if (niveauMoyen >= 3) {
                statut = 'Maîtrisé';
            } else if (niveauMoyen >= 2) {
                statut = 'En cours';
            } else if (niveauMoyen > 0) {
                statut = 'À travailler';
            } else {
                statut = 'Non évalué';
            }
        }
        
        if (statut === 'Maîtrisé') totalMaitrisees++;
        
        // Déterminer les classes et couleurs
        const competenceColorClass = getCompetenceColorClass(comp.competence_code);
        const statusClass = getStatusClass(statut);
        
        // Définir les couleurs
        let bgColor = '';
        let borderColor = '';
        
        if (competenceColorClass === 'competence-orange') {
            bgColor = 'rgba(243, 156, 18, 0.25)';
            borderColor = '#f39c12';
        } else if (competenceColorClass === 'competence-green') {
            bgColor = 'rgba(39, 174, 96, 0.25)';
            borderColor = '#27ae60';
        } else if (competenceColorClass === 'competence-bleu') {
            bgColor = 'rgba(52, 152, 219, 0.25)';
            borderColor = '#3498db';
        }
        
        // Créer les cellules avec styles inline
        const cells = [
            `<td style="background-color: ${bgColor}; border-left: 5px solid ${borderColor};"><strong>${comp.competence_code || 'N/A'}</strong></td>`,
            `<td style="background-color: ${bgColor};">${comp.competence_libelle || 'Libellé non disponible'}</td>`,
            `<td style="background-color: ${bgColor};">${(comp.niveau_moyen || 0).toFixed(2)}</td>`,
            `<td style="background-color: ${bgColor};">${comp.nb_validations || 0}</td>`,
            `<td style="background-color: ${bgColor};">${comp.total_niveaux || 0}</td>`,
            `<td style="background-color: ${bgColor};"><span class="${statusClass}">${statut}</span></td>`,
            `<td style="background-color: ${bgColor};">${comp.nb_eval_premiere || 0}</td>`,
            `<td style="background-color: ${bgColor};">${comp.nb_eval_terminale || 0}</td>`
        ];
        
        row.innerHTML = cells.join('');
        tbody.appendChild(row);
    });
    
    // Mise à jour des statistiques du profil
    const totalCompetencesElem = document.getElementById('totalCompetences');
    const competencesMaitriseesElem = document.getElementById('competencesMaitrisees');
    const moyenneGeneraleElem = document.getElementById('moyenneGenerale');
    
    if (totalCompetencesElem) totalCompetencesElem.textContent = competences.length;
    if (competencesMaitriseesElem) competencesMaitriseesElem.textContent = totalMaitrisees;
    
    const moyenneGenerale = competencesEvaluees > 0 ? (totalPoints / competencesEvaluees).toFixed(2) : '0.00';
    if (moyenneGeneraleElem) moyenneGeneraleElem.textContent = moyenneGenerale;

    console.log('🎨 Debug couleurs appliquées');
}

/**
 * Crée les graphiques radar et barres
 */
function createCharts(competences) {
    // Détruire les anciens graphiques s'ils existent
    if (radarChartInstance) radarChartInstance.destroy();
    if (barChartInstance) barChartInstance.destroy();
    
    const radarCanvas = document.getElementById('radarChart');
    const barCanvas = document.getElementById('barChart');
    
    if (!radarCanvas || !barCanvas) return;
    
    const labels = competences.map(c => c.competence_code);
    const niveaux = competences.map(c => c.niveau_moyen);
    const validations = competences.map(c => c.nb_validations);
    
    // Couleurs selon le type de bilan
    const colors = typeBilan === 'intermediaire' ? {
        primary: 'rgba(52, 152, 219, 1)',
        primaryLight: 'rgba(52, 152, 219, 0.2)',
        secondary: 'rgba(46, 204, 113, 1)',
        secondaryLight: 'rgba(46, 204, 113, 0.6)',
        tertiary: 'rgba(155, 89, 182, 1)',
        tertiaryLight: 'rgba(155, 89, 182, 0.6)'
    } : {
        primary: 'rgba(231, 76, 60, 1)',
        primaryLight: 'rgba(231, 76, 60, 0.2)',
        secondary: 'rgba(230, 126, 34, 1)',
        secondaryLight: 'rgba(230, 126, 34, 0.6)',
        tertiary: 'rgba(155, 89, 182, 1)',
        tertiaryLight: 'rgba(155, 89, 182, 0.6)'
    };
    
    // Graphique Radar
    const radarCtx = radarCanvas.getContext('2d');
    radarChartInstance = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Niveau Moyen',
                data: niveaux,
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
                borderWidth: 2,
                pointBackgroundColor: colors.primary,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colors.primary
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 4,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return ['0', '1', '2', '3', '4'][value];
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 11
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Profil des Compétences',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top',
                }
            }
        }
    });
    
    // Graphique Barres
    const barCtx = barCanvas.getContext('2d');
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Niveau Moyen',
                    data: niveaux,
                    backgroundColor: colors.secondaryLight,
                    borderColor: colors.secondary,
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Nombre Validations',
                    data: validations,
                    backgroundColor: colors.tertiaryLight,
                    borderColor: colors.tertiary,
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 4,
                    title: {
                        display: true,
                        text: 'Niveau Moyen'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Nombre Validations'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Comparaison Niveau vs Validations',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

/**
 * Exporte le bilan en PDF
 */
/**
 * Exporte le bilan en PDF
 */
async function exportToPDF() {
    const button = document.getElementById('exportPDF');
    
    try {
        // Désactiver le bouton pendant l'export
        if (button) {
            button.disabled = true;
            button.textContent = 'Génération du PDF...';
        }
        
        // Récupérer les informations de l'élève
        const userName = document.getElementById('profileName')?.textContent || 'Eleve';
        const userClasse = document.getElementById('profileClasse')?.textContent || '';
        const reportDate = document.getElementById('reportDate')?.textContent || '';
        
        // Créer le nom du fichier
        const fileName = `Bilan_${userName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Utiliser window.print() pour l'export PDF natif du navigateur
        // C'est la solution la plus simple et la plus fiable
        //window.print();
        
        // Alternative: Si vous voulez une vraie génération PDF avec jsPDF
        // Décommentez le code ci-dessous et ajoutez les librairies nécessaires
        
        
        // Il faut d'abord ajouter dans le HTML:
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Cacher les éléments non imprimables
        document.querySelector('.bilan-actions').style.display = 'none';
        document.querySelector('.export-section').style.display = 'none';
        
        // Capturer le contenu
        const content = document.getElementById('bilanContent');
        const canvas = await html2canvas(content, {
            scale: 2,
            useCORS: true,
            logging: false
        });
        
        // Réafficher les éléments
        document.querySelector('.bilan-actions').style.display = 'flex';
        document.querySelector('.export-section').style.display = 'block';
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Ajouter l'en-tête
        /*pdf.setFontSize(16);
        pdf.text('Bilan des Compétences - BAC PRO CIEL', 105, 15, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(userName, 105, 25, { align: 'center' });
        pdf.text(userClasse, 105, 32, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text(`Généré le: ${reportDate}`, 105, 39, { align: 'center' });
        
        position = 45;*/
        
        // Ajouter l'image
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (297 - position); // A4 height - header
        
        // Ajouter des pages si nécessaire
        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= 297;
        }
        
        // Sauvegarder le PDF
        pdf.save(fileName);
        
        
    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        alert('Erreur lors de l\'export PDF: ' + error.message);
    } finally {
        // Réactiver le bouton
        if (button) {
            button.disabled = false;
            button.textContent = 'Exporter en PDF';
        }
    }
}

/**
 * Exporte le bilan en Excel
 */
function exportToExcel() {
    alert('Fonctionnalité Excel à implémenter - Le bilan sera exporté au format Excel');
    // Implémentation future avec SheetJS
}

/**
 * Réinitialise l'affichage
 */
function resetBilan() {
    const bilanContent = document.getElementById('bilanContent');
    if (bilanContent) {
        bilanContent.style.display = 'none';
    }
    
    if (radarChartInstance) {
        radarChartInstance.destroy();
        radarChartInstance = null;
    }
    if (barChartInstance) {
        barChartInstance.destroy();
        barChartInstance = null;
    }
}