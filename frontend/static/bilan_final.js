// Variables globales pour les graphiques
let radarChartInstance = null;
let barChartInstance = null;
let typeBilan = 'final';

// Définition des groupes de compétences par épreuve
const EPREUVES = {
    E2: ['C03', 'C07', 'C11'],
    E31: ['C06', 'C09', 'C10'],
    E32: ['C01', 'C04', 'C08']
};

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
            displayEpreuvesTables(competencesData);
            
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
    const sessionYear = document.getElementById('sessionYear');

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

    // Calcul de l'année de certification (année scolaire actuelle)
    if (sessionYear) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // Janvier = 1
        
        // Si nous sommes entre septembre et décembre, l'année de certification est l'année suivante
        // Si nous sommes entre janvier et août, l'année de certification est l'année en cours
        const certificationYear = currentMonth >= 9 ? currentYear + 1 : currentYear;
        
        sessionYear.textContent = certificationYear;
    }

}
/**
 * Détermine la classe CSS pour une compétence spécifique
 */
function getCompetenceColorClass(competenceCode) {
    if (!competenceCode) return '';
    
    // Compétences en ORANGE (E2)
    if (EPREUVES.E2.includes(competenceCode)) {
        return 'competence-orange';
    }
    // Compétences en VERT (E31)
    else if (EPREUVES.E31.includes(competenceCode)) {
        return 'competence-green';
    }
    // Compétences en BLEU (E32)
    else if (EPREUVES.E32.includes(competenceCode)) {
        return 'competence-bleu';
    }
    
    return ''; // Pas de couleur spécifique
}

/**
 * Détermine la classe CSS pour le statut
 */
function getStatusClass(statut) {
    // Normaliser le statut (enlever accents, mettre en minuscule)
    const statutNormalise = statut.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
 * Crée une ligne de tableau pour une compétence
 */
function createCompetenceRow(comp) {
    const row = document.createElement('tr');
    
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
        `<td style="background-color: ${bgColor};"><span class="${statusClass}">${statut}</span></td>`
    ];
    
    row.innerHTML = cells.join('');
    return row;
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
        const row = createCompetenceRow(comp);
        tbody.appendChild(row);
        
        // Calcul des statistiques globales
        if (comp.nb_validations > 0) {
            competencesEvaluees++;
            totalPoints += comp.total_niveaux || 0;
            totalValidations += comp.nb_validations;
        }
        
        // Compter les compétences maîtrisées
        let statut = comp.statut;
        if (!statut) {
            const niveauMoyen = comp.niveau_moyen || 0;
            if (niveauMoyen >= 3) {
                statut = 'Maîtrisé';
            }
        }
        
        if (statut === 'Maîtrisé') totalMaitrisees++;
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
 * Affiche les tableaux par épreuve
 */
function displayEpreuvesTables(competences) {
    // Tableau E2
    displayEpreuveTable('E2', EPREUVES.E2, competences, 'epreuve-e2-body', 'e2Summary');
    
    // Tableau E31
    displayEpreuveTable('E31', EPREUVES.E31, competences, 'epreuve-e31-body', 'e31Summary');
    
    // Tableau E32
    displayEpreuveTable('E32', EPREUVES.E32, competences, 'epreuve-e32-body', 'e32Summary');
}

/**
 * Convertit un statut en valeur numérique pour le calcul de note
 */
function getStatutValue(statut) {
    const statutNormalise = statut.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (statutNormalise.includes('maitrise')) {
        return 1; // Maîtrisé
    } else if (statutNormalise.includes('en cours')) {
        return 0.66; // En cours
    } else if (statutNormalise.includes('travailler')) {
        return 0.33; // À travailler
    } else {
        return 0; // Non évalué
    }
}

/**
 * Arrondit une note au demi-point supérieur
 */
function arrondiDemiPointSuperieur(note) {
    return Math.ceil(note * 2) / 2;
}

/**
 * Calcule la note sur 20 pour l'épreuve E2
 */
function calculateE2Note(competences) {
    // Coefficients pour E2
    const coefficients = {
        'C03': 0.2,
        'C07': 0.3,
        'C11': 0.5
    };
    
    let noteC03 = 0;
    let noteC07 = 0;
    let noteC11 = 0;
    
    competences.forEach(comp => {
        const code = comp.competence_code;
        
        // Déterminer le statut
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
        
        const A = getStatutValue(statut);
        
        if (code === 'C03') {
            noteC03 = A * coefficients['C03'] * 20;
        } else if (code === 'C07') {
            noteC07 = A * coefficients['C07'] * 20;
        } else if (code === 'C11') {
            noteC11 = A * coefficients['C11'] * 20;
        }
    });
    
    const noteTotal = noteC03 + noteC07 + noteC11;
    const noteArrondie = arrondiDemiPointSuperieur(noteTotal);
    
    return {
        noteC03: noteC03.toFixed(2),
        noteC07: noteC07.toFixed(2),
        noteC11: noteC11.toFixed(2),
        noteTotal: noteTotal.toFixed(2),
        noteArrondie: noteArrondie.toFixed(1)
    };
}

/**
 * Calcule la note sur 20 pour l'épreuve E2
 */
function calculateE31Note(competences) {
    // Coefficients pour E31
    const coefficients = {
        'C06': 0.25,
        'C09': 0.5,
        'C10': 0.25
    };
    
    let noteC06 = 0;
    let noteC09 = 0;
    let noteC10 = 0;
    
    competences.forEach(comp => {
        const code = comp.competence_code;
        
        // Déterminer le statut
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
        
        const A = getStatutValue(statut);
        
        if (code === 'C06') {
            noteC06 = A * coefficients['C06'] * 20;
        } else if (code === 'C09') {
            noteC09 = A * coefficients['C09'] * 20;
        } else if (code === 'C10') {
            noteC10 = A * coefficients['C10'] * 20;
        }
    });
    
    const noteTotal = noteC06 + noteC09 + noteC10;
    const noteArrondie = arrondiDemiPointSuperieur(noteTotal);
    
    return {
        noteC06: noteC06.toFixed(2),
        noteC09: noteC09.toFixed(2),
        noteC10: noteC10.toFixed(2),
        noteTotal: noteTotal.toFixed(2),
        noteArrondie: noteArrondie.toFixed(1)
    };
}

/**
 * Calcule la note sur 20 pour l'épreuve E32
 */
function calculateE32Note(competences) {
    // Coefficients pour E32
    const coefficients = {
        'C01': 0.25,
        'C04': 0.5,
        'C08': 0.25
    };
    
    let noteC01 = 0;
    let noteC04 = 0;
    let noteC08 = 0;
    
    competences.forEach(comp => {
        const code = comp.competence_code;
        
        // Déterminer le statut
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
        
        const A = getStatutValue(statut);
        
        if (code === 'C01') {
            noteC01 = A * coefficients['C01'] * 20;
        } else if (code === 'C04') {
            noteC04 = A * coefficients['C04'] * 20;
        } else if (code === 'C08') {
            noteC08 = A * coefficients['C08'] * 20;
        }
    });
    
    const noteTotal = noteC01 + noteC04 + noteC08;
    const noteArrondie = arrondiDemiPointSuperieur(noteTotal);
    
    return {
        noteC01: noteC01.toFixed(2),
        noteC04: noteC04.toFixed(2),
        noteC08: noteC08.toFixed(2),
        noteTotal: noteTotal.toFixed(2),
        noteArrondie: noteArrondie.toFixed(1)
    };
}

/**
 * Affiche un tableau pour une épreuve spécifique
 */
function displayEpreuveTable(epreuveName, competenceCodes, allCompetences, tbodyId, summaryId) {
    const tbody = document.getElementById(tbodyId);
    const summary = document.getElementById(summaryId);
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Filtrer les compétences pour cette épreuve
    const epreuveCompetences = allCompetences.filter(comp => 
        competenceCodes.includes(comp.competence_code)
    );
    
    // Statistiques pour cette épreuve
    let maitrisees = 0;
    let enCours = 0;
    let aTravailler = 0;
    let nonEvaluees = 0;
    
    // Afficher chaque compétence
    epreuveCompetences.forEach(comp => {
        const row = createCompetenceRow(comp);
        tbody.appendChild(row);
        
        // Déterminer le statut
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
        
        // Compter les statuts
        const statutNormalise = statut.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (statutNormalise.includes('maitrise')) {
            maitrisees++;
        } else if (statutNormalise.includes('en cours')) {
            enCours++;
        } else if (statutNormalise.includes('travailler')) {
            aTravailler++;
        } else {
            nonEvaluees++;
        }
    });
    
    // Afficher le résumé avec calcul de note pour E2, E31 et E32
    if (summary) {
        const total = epreuveCompetences.length;
        const pourcentageMaitrise = total > 0 ? ((maitrisees / total) * 100).toFixed(1) : 0;
        
        let summaryHTML = `
            <strong>Résumé ${epreuveName}:</strong> 
            ${total} compétence(s) - 
            <span style="color: var(--success-color);">${maitrisees} maîtrisée(s)</span>, 
            <span style="color: var(--warning-color);">${enCours} en cours</span>, 
            <span style="color: var(--danger-color);">${aTravailler} à travailler</span>, 
            <span style="color: var(--gray-dark);">${nonEvaluees} non évaluée(s)</span>
            - Taux de maîtrise: <strong>${pourcentageMaitrise}%</strong>
        `;
        
        // Calcul de la note pour E2
        if (epreuveName === 'E2') {
            const notes = calculateE2Note(epreuveCompetences);
            summaryHTML += `
                <br><br>
                <strong>📊 Calcul de la note sur 20:</strong><br>
                <span style="margin-left: 20px;">
                    • C03 (coef 0,2): <strong>${notes.noteC03}</strong> points<br>
                    • C07 (coef 0,3): <strong>${notes.noteC07}</strong> points<br>
                    • C11 (coef 0,5): <strong>${notes.noteC11}</strong> points<br>
                    <strong style="font-size: 1.2em; color: var(--primary-color);">
                        ➜ Note finale: ${notes.noteArrondie} / 20
                    </strong>
                    <em style="color: #666;"> (calculée: ${notes.noteTotal}, arrondie au demi-point supérieur)</em>
                </span>
            `;
        }
        
        if (epreuveName === 'E31') {
            const notes = calculateE31Note(epreuveCompetences);
            summaryHTML += `
                <br><br>
                <strong>📊 Calcul de la note sur 20:</strong><br>
                <span style="margin-left: 20px;">
                    • C06 (coef 0,25): <strong>${notes.noteC06}</strong> points<br>
                    • C09 (coef 0,5): <strong>${notes.noteC09}</strong> points<br>
                    • C10 (coef 0,25): <strong>${notes.noteC10}</strong> points<br>
                    <strong style="font-size: 1.2em; color: var(--primary-color);">
                        ➜ Note finale: ${notes.noteArrondie} / 20
                    </strong>
                    <em style="color: #666;"> (calculée: ${notes.noteTotal}, arrondie au demi-point supérieur)</em>
                </span>
            `;
        }

        if (epreuveName === 'E32') {
            const notes = calculateE32Note(epreuveCompetences);
            summaryHTML += `
                <br><br>
                <strong>📊 Calcul de la note sur 20:</strong><br>
                <span style="margin-left: 20px;">
                    • C01 (coef 0,25): <strong>${notes.noteC01}</strong> points<br>
                    • C04 (coef 0,5): <strong>${notes.noteC04}</strong> points<br>
                    • C18 (coef 0,25): <strong>${notes.noteC08}</strong> points<br>
                    <strong style="font-size: 1.2em; color: var(--primary-color);">
                        ➜ Note finale: ${notes.noteArrondie} / 20
                    </strong>
                    <em style="color: #666;"> (calculée: ${notes.noteTotal}, arrondie au demi-point supérieur)</em>
                </span>
            `;
        }

        summary.innerHTML = summaryHTML;
    }

    console.log(`✅ Tableau ${epreuveName} généré avec ${epreuveCompetences.length} compétences`);
}

/**
 * Exporte le bilan en PDF en capturant chaque section séparément
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
        const fileName = `Bilan_${userName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Dimensions A4 en mm
        const pdfWidth = 210;
        const pdfHeight = 297;
        const margin = 10;
        const contentWidth = pdfWidth - (2 * margin);
        
        // Cacher les éléments non imprimables
        const bilanActions = document.querySelector('.bilan-actions');
        const exportSection = document.querySelector('.export-section');
        const bilanHeader = document.querySelector('.bilan-header');
        
        if (bilanActions) bilanActions.style.display = 'none';
        if (exportSection) exportSection.style.display = 'none';
        if (bilanHeader) bilanHeader.style.display = 'none';
        
        let currentY = margin;
        let isFirstPage = true;
        
        // Récupérer toutes les sections dans l'ordre d'apparition dans le DOM
        const bacHeaderSection = document.querySelector('.bac-header-section');
        const profileSection = document.querySelector('.profile-section');
        const tableSections = document.querySelectorAll('.table-section');
        
        console.log(`📊 Nombre de sections de tableau trouvées: ${tableSections.length}`);
        
        // Construire la liste des sections à capturer
        const sectionsToCapture = [];
        
        if (bacHeaderSection) sectionsToCapture.push({ element: bacHeaderSection, name: 'En-tête BAC' });
        if (profileSection) sectionsToCapture.push({ element: profileSection, name: 'Profil élève' });
        
        tableSections.forEach((section, index) => {
            const title = section.querySelector('.table-header h3')?.textContent || `Tableau ${index + 1}`;
            sectionsToCapture.push({ element: section, name: title });
        });
        
        console.log(`📋 Sections à capturer:`, sectionsToCapture.map(s => s.name));
        
        // Capturer chaque section
        for (let i = 0; i < sectionsToCapture.length; i++) {
            const section = sectionsToCapture[i];
            
            if (!section.element) {
                console.warn(`Section ${section.name} non trouvée`);
                continue;
            }
            
            console.log(`📸 Capture de: ${section.name}`);
            
            // Capturer la section
            const canvas = await html2canvas(section.element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: section.element.scrollWidth,
                windowHeight: section.element.scrollHeight
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * contentWidth) / canvas.width;
            
            // Vérifier si on doit ajouter une nouvelle page
            if (!isFirstPage && (currentY + imgHeight) > (pdfHeight - margin)) {
                pdf.addPage();
                currentY = margin;
                console.log(`📄 Nouvelle page ajoutée pour: ${section.name}`);
            }
            
            // Ajouter l'image au PDF
            pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 5; // Ajouter un petit espace entre les sections
            
            isFirstPage = false;
            
            // Si la section suivante ne peut pas tenir, passer à une nouvelle page
            if (currentY > (pdfHeight - 50)) {
                pdf.addPage();
                currentY = margin;
            }
        }
        
        // Réafficher les éléments
        if (bilanActions) bilanActions.style.display = 'flex';
        if (exportSection) exportSection.style.display = 'block';
        if (bilanHeader) bilanHeader.style.display = 'flex';
        
        // Sauvegarder le PDF
        pdf.save(fileName);
        
        console.log('✅ PDF généré avec succès:', fileName);
        console.log(`📄 Nombre total de pages: ${pdf.internal.getNumberOfPages()}`);
        
    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        alert('Erreur lors de l\'export PDF: ' + error.message);
    } finally {
        // Réactiver le bouton et réafficher les éléments cachés
        if (button) {
            button.disabled = false;
            button.textContent = 'Exporter en PDF';
        }
        
        // S'assurer que tous les éléments sont réaffichés
        const bilanActions = document.querySelector('.bilan-actions');
        const exportSection = document.querySelector('.export-section');
        const bilanHeader = document.querySelector('.bilan-header');
        
        if (bilanActions) bilanActions.style.display = 'flex';
        if (exportSection) exportSection.style.display = 'block';
        if (bilanHeader) bilanHeader.style.display = 'flex';
    }
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