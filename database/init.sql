
-- Suppression des tables si elles existent (pour permettre une réinitialisation complète)
DROP TABLE IF EXISTS validations CASCADE;
DROP TABLE IF EXISTS evaluation_attributions CASCADE;
DROP TABLE IF EXISTS evaluation_items CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS competences CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

-- Table des utilisateurs
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    classe VARCHAR(50) NOT NULL,
    specialite VARCHAR(100),
    date_naissance DATE,
    date_entree_bac INTEGER,
    date_certification INTEGER,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des compétences
CREATE TABLE competences (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    libelle TEXT NOT NULL,
    domaine VARCHAR(100) DEFAULT 'BAC PRO CIEL'
);

-- Table des items
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    competence_id INTEGER NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
    code_item VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    sous_item TEXT,
    UNIQUE(competence_id, code_item)
);

-- Table des évaluations
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    pole VARCHAR(50),
    module VARCHAR(100) NOT NULL,
    contexte TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison évaluation - items
CREATE TABLE evaluation_items (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE(evaluation_id, item_id)
);

-- Table pour les attributions d'évaluations (par classe ou par utilisateur)
CREATE TABLE evaluation_attributions (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    classe VARCHAR(50) NULL,
    utilisateur_id INTEGER NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Contrainte pour s'assurer qu'on a soit une classe, soit un utilisateur, mais pas les deux
    CHECK (
        (classe IS NOT NULL AND utilisateur_id IS NULL) OR 
        (classe IS NULL AND utilisateur_id IS NOT NULL)
    ),
    -- Contrainte d'unicité pour éviter les doublons
    UNIQUE(evaluation_id, classe),
    UNIQUE(evaluation_id, utilisateur_id)
);

-- Table pour les validations
CREATE TABLE validations (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    evaluation_id INTEGER NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    niveau_validation INTEGER CHECK (niveau_validation BETWEEN 0 AND 4),
    commentaire TEXT,
    date_validation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validateur VARCHAR(100) DEFAULT 'Enseignant',
    UNIQUE(utilisateur_id, evaluation_id, item_id)
);

-- Insertion des compétences
INSERT INTO competences (code, libelle) VALUES
('C01', 'COMMUNIQUER EN SITUATION PROFESSIONNELLE (FRANÇAIS/ANGLAIS)'),
('C03', 'PARTICIPER A UN PROJET'),
('C04', 'ANALYSER UNE STRUCTURE MATÉRIELLE ET LOGICIELLE'),
('C06', 'VALIDER LA CONFORMITÉ D''UNE INSTALLATION'),
('C07', 'RÉALISER DES MAQUETTES ET PROTOTYPES'),
('C08', 'CODER'),
('C09', 'INSTALLER LES ÉLÉMENTS D''UN SYSTÈME ÉLECTRONIQUE OU INFORMATIQUE'),
('C10', 'EXPLOITER UN RÉSEAU INFORMATIQUE'),
('C11', 'MAINTENIR UN SYSTÈME ÉLECTRONIQUE OU RÉSEAU INFORMATIQUE');

-- Insertion des items pour C01
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(1, 'Item1-1', 'Présentation soignée', 'La présentation (typographie, orthographe, illustration, lisibilité) est soignée et soutient le discours avec des enchaînements cohérents'),
(1, 'Item1-2', 'Présentation orale de qualité', 'La présentation orale (support et expression) est de qualité et claire'),
(1, 'Item1-3', 'Argumentation de qualité', 'L''argumentation développée lors de la présentation et de l''échange est de qualité'),
(1, 'Item1-4', 'Prise en compte des handicaps', 'L''argumentation tient compte des éventuelles situations de handicap des personnes avec lesquelles il interagit');

-- Insertion des items pour C03
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(2, 'Item3-1', 'Identification des rôles et tâches', 'Les rôles et tâches de chacun sont identifiés ; le cas échéant, les besoins spécifiques des personnes en situation de handicap sont pris en compte'),
(2, 'Item3-2', 'Compréhension du planning', 'Le planning prévisionnel est compris'),
(2, 'Item3-3', 'Respect du suivi', 'Le suivi du projet est respecté'),
(2, 'Item3-4', 'Utilisation espace collaboratif', 'L''espace collaboratif est correctement utilisé');

-- Insertion des items pour C04
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(3, 'Item4-1', 'Identification besoin et ressources', 'Le besoin est identifié ainsi que les ressources matérielles, logicielles et humaines'),
(3, 'Item4-2', 'Utilisation logiciels d''analyse', 'Les logiciels d''analyse et de tests sont utilisés selon les procédures de traitement d''incidents'),
(3, 'Item4-3', 'Extraction informations documents', 'Les informations nécessaires sont extraites des documents réglementaires et/ou constructeurs'),
(3, 'Item4-4', 'Interprétation indicateurs', 'Les indicateurs de fonctionnement sont interprétés'),
(3, 'Item4-5', 'Renseignement fiches', 'Les fiches de test ou d''intervention sont renseignées');

-- Insertion des items pour C06
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(4, 'Item6-1', 'Respect cahier des charges', 'Les exigences du cahier des charges sont respectées'),
(4, 'Item6-2', 'Réalisation tests', 'Les tests sont effectués'),
(4, 'Item6-3', 'Vérification résultats', 'Les résultats attendus sont vérifiés'),
(4, 'Item6-4', 'Respect procédure test', 'La procédure de test est respectée');

-- Insertion des items pour C07
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(5, 'Item7-1', 'Conformité placement et routage', 'Le placement et routage sont conformes au cahier des charges'),
(5, 'Item7-2', 'Génération fichiers fabrication', 'La génération des fichiers de fabrication du PCB est conforme aux attentes'),
(5, 'Item7-3', 'Réalisation PCB conforme', 'Le PCB est réalisé, contrôlé et conforme aux IPC (tolérances mécaniques, finition de surface, propreté, ESD etc.)'),
(5, 'Item7-4', 'Conformité composants', 'Les composants sont conformes à la nomenclature (marquage, étiquetage)'),
(5, 'Item7-5', 'Respect nomenclature', 'La nomenclature des composants est respectée'),
(5, 'Item7-6', 'Brasage conforme', 'Le brasage de la carte est conforme à la nomenclature et aux IPC'),
(5, 'Item7-7', 'Intégration contraintes environnementales', 'Les contraintes liées aux impacts environnementaux sont intégrées'),
(5, 'Item7-8', 'Contrôle visuel carte', 'Le contrôle visuel de la carte assemblée est conforme au dossier de fabrication'),
(5, 'Item7-9', 'Repérage risques sécurité', 'Les risques d''une situation de travail sont repérés et les mesures appropriées pour sa santé, sa sécurité et celle des autres sont adoptées');

-- Insertion des items pour C08
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(6, 'Item8-1', 'Mise en œuvre environnements', 'Les environnements de développement et de test sont mis en oeuvre en tenant compte des contraintes de fonctionnalités et de sécurité'),
(6, 'Item8-2', 'Débogage module', 'Le module logiciel est débogué et syntaxiquement correct'),
(6, 'Item8-3', 'Développement composants', 'Les composants logiciels individuels sont développés et testés conformément aux spécifications du cahier des charges et des bonnes pratiques'),
(6, 'Item8-4', 'Intégration solution', 'La solution (logicielle et matérielle) est intégrée et testée conformément aux spécifications du cahier des charges et des bonnes pratiques'),
(6, 'Item8-5', 'Commentaires et documentation', 'Le code est commenté et le logiciel est documenté');

-- Insertion des items pour C09
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(7, 'Item9-1', 'Vérification éléments installation', 'L''ensemble des éléments pour l''installation du système est complet et vérifié par rapport au cahier des charges'),
(7, 'Item9-2', 'Installation et raccordement', 'Les éléments du système sont installés et raccordés selon une procédure'),
(7, 'Item9-3', 'Réalisation configuration', 'La configuration est réalisée'),
(7, 'Item9-4', 'Mise en service', 'La mise en service est réalisée'),
(7, 'Item9-5', 'Renseignement état installation', 'L''état de l''installation est renseigné de manière écrite ou orale'),
(7, 'Item9-6', 'Repérage risques sécurité', 'Les risques d''une situation de travail sont repérés et les mesures appropriées pour sa santé, sa sécurité et celle des autres sont adoptées');

-- Insertion des items pour C10
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(8, 'Item10-1', 'Renseignement alertes', 'Les alertes et problèmes rencontrés sont renseignés'),
(8, 'Item10-2', 'Identification éléments réseau', 'Les différents éléments d''un réseau ou d''un système à partir d''un schéma fourni sont identifiés'),
(8, 'Item10-3', 'Mise à jour équipements', 'La mise à jour des équipements (iOS , OS, logiciel, firmware) est effectuée'),
(8, 'Item10-4', 'Optimisations', 'Les optimisations nécessaires sont effectuées');

-- Insertion des items pour C11
INSERT INTO items (competence_id, code_item, description, sous_item) VALUES
(9, 'Item11-1', 'Préparation intervention', 'L''intervention est préparée'),
(9, 'Item11-2', 'Constatation dysfonctionnement', 'Le dysfonctionnement est constaté'),
(9, 'Item11-3', 'Réalisation maintenance', 'La maintenance ou la réparation est réalisée'),
(9, 'Item11-4', 'Renseignement fiche intervention', 'La fiche d''intervention est correctement renseignée'),
(9, 'Item11-5', 'Repérage risques sécurité', 'Les risques d''une situation de travail sont repérés et les mesures appropriées pour sa santé, sa sécurité et celle des autres sont adoptées');

-- Utilisateurs initiaux
INSERT INTO utilisateurs (nom, prenom, email, classe, specialite) VALUES
('Dupont', 'Jean', 'jean.dupont@bacpro-ciel.fr', 'Terminale', 'BP CIEL'),
('Martin', 'Marie', 'marie.martin@bacpro-ciel.fr', 'Première', 'BP CIEL'),
('Bernard', 'Pierre', 'pierre.bernard@bacpro-ciel.fr', 'Terminale', 'BP CIEL'),
('Dubois', 'Sophie', 'sophie.dubois@bacpro-ciel.fr', 'Première', 'BP CIEL'),
('Moreau', 'Thomas', 'thomas.moreau@bacpro-ciel.fr', 'Terminale', 'BP CIEL'),
('Petit', 'Laura', 'laura.petit@bacpro-ciel.fr', 'Seconde', 'BP CIEL'),
('Roux', 'Lucas', 'lucas.roux@bacpro-ciel.fr', 'Seconde', 'BP CIEL'),
('Garcia', 'Emma', 'emma.garcia@bacpro-ciel.fr', 'Première', 'BP CIEL'),
('Fournier', 'Hugo', 'hugo.fournier@bacpro-ciel.fr', 'Terminale', 'BP CIEL'),
('Leroy', 'Chloé', 'chloe.leroy@bacpro-ciel.fr', 'Première', 'BP CIEL');

-- Évaluations d'exemple
INSERT INTO evaluations (pole, module, contexte, date_creation) VALUES
('Informatique', 'Projet communication professionnelle', 'Évaluation des compétences en communication dans le cadre du projet semestriel - Présentation orale et écrite', NOW()),
('Electronique', 'TP installation réseau', 'Travaux pratiques d''installation et configuration d''un réseau local entreprise', NOW()),
('Cybersécurité', 'Développement application web', 'Projet de développement d''une application web avec base de données', NOW()),
('Informatique', 'Maintenance système', 'Atelier de maintenance préventive et corrective sur parc informatique', NOW()),
('Communication', 'Présentation orale', 'Évaluation des compétences en présentation orale pour le chef d''œuvre', NOW());

-- Lier des items aux évaluations (exemples)
INSERT INTO evaluation_items (evaluation_id, item_id) VALUES
-- Évaluation 1 (Communication) - Items C01
(1, 1), (1, 2), (1, 3), (1, 4),
-- Évaluation 2 (Réseau) - Items C10
(2, 29), (2, 30), (2, 31), (2, 32),
-- Évaluation 3 (Développement) - Items C08
(3, 22), (3, 23), (3, 24), (3, 25), (3, 26),
-- Évaluation 4 (Maintenance) - Items C11
(4, 33), (4, 34), (4, 35), (4, 36), (4, 37),
-- Évaluation 5 (Présentation) - Items C01
(5, 1), (5, 2), (5, 3);

-- Attributions d'évaluations (par classe et par utilisateur)
INSERT INTO evaluation_attributions (evaluation_id, classe, utilisateur_id) VALUES
-- Attribution par classe
(1, 'Terminale', NULL),  -- Évaluation 1 pour toute la Terminale
(2, 'Première', NULL),   -- Évaluation 2 pour toute la Première
(3, 'Seconde', NULL),    -- Évaluation 3 pour toute la Seconde
-- Attribution par utilisateur spécifique
(4, NULL, 1),           -- Évaluation 4 pour Jean Dupont uniquement
(4, NULL, 3),           -- Évaluation 4 pour Pierre Bernard également
(5, NULL, 2),           -- Évaluation 5 pour Marie Martin uniquement
(1, NULL, 10);          -- Évaluation 1 aussi pour Chloé Leroy (en plus de sa classe)

-- Validations d'exemple
INSERT INTO validations (utilisateur_id, evaluation_id, item_id, niveau_validation, commentaire, validateur) VALUES
(1, 1, 1, 3, 'Très bonne présentation, supports de qualité', 'M. Durand'),
(1, 1, 2, 4, 'Expression orale excellente, très à l''aise', 'M. Durand'),
(1, 1, 3, 2, 'Argumentation correcte mais pourrait être plus développée', 'M. Durand'),
(2, 1, 1, 3, 'Bonne présentation, soignée', 'M. Durand'),
(2, 1, 2, 3, 'Expression claire, bon support', 'M. Durand'),
(3, 2, 29, 2, 'Bonne identification des besoins', 'Mme Martin'),
(3, 2, 30, 3, 'Maîtrise des outils d''analyse', 'Mme Martin'),
(4, 3, 22, 4, 'Excellente mise en œuvre des environnements', 'M. Lefebvre'),
(4, 3, 23, 3, 'Débogage efficace', 'M. Lefebvre'),
(1, 4, 33, 4, 'Excellente préparation de l''intervention', 'M. Durand'),
(3, 4, 33, 3, 'Bonne préparation, documentation complète', 'M. Durand');

-- Index pour améliorer les performances
CREATE INDEX idx_items_competence_id ON items(competence_id);
CREATE INDEX idx_evaluation_items_evaluation_id ON evaluation_items(evaluation_id);
CREATE INDEX idx_evaluation_items_item_id ON evaluation_items(item_id);
CREATE INDEX idx_evaluation_attributions_evaluation_id ON evaluation_attributions(evaluation_id);
CREATE INDEX idx_evaluation_attributions_classe ON evaluation_attributions(classe);
CREATE INDEX idx_evaluation_attributions_utilisateur_id ON evaluation_attributions(utilisateur_id);
CREATE INDEX idx_validations_utilisateur_id ON validations(utilisateur_id);
CREATE INDEX idx_validations_evaluation_id ON validations(evaluation_id);
CREATE INDEX idx_validations_item_id ON validations(item_id);
CREATE INDEX idx_utilisateurs_classe ON utilisateurs(classe);

-- Vue pratique pour récupérer les utilisateurs concernés par une évaluation
CREATE OR REPLACE VIEW v_utilisateurs_evaluations AS
SELECT 
    e.id as evaluation_id,
    e.module,
    ea.classe,
    ea.utilisateur_id,
    u.id as user_id,
    u.nom,
    u.prenom,
    u.classe as user_classe,
    u.email
FROM evaluations e
LEFT JOIN evaluation_attributions ea ON e.id = ea.evaluation_id
LEFT JOIN utilisateurs u ON 
    (ea.classe IS NOT NULL AND u.classe = ea.classe) 
    OR (ea.utilisateur_id IS NOT NULL AND u.id = ea.utilisateur_id);

-- Message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE 'Base de données initialisée avec succès!';
    RAISE NOTICE 'Table evaluation_attributions créée pour gérer les attributions par classe ou utilisateur';
    RAISE NOTICE 'Vue v_utilisateurs_evaluations créée pour faciliter les requêtes';
END $$;


-- ========================================
-- MIGRATION : Système d'archivage des élèves
-- À exécuter sur votre base de données existante
-- ========================================

-- Table pour archiver les élèves diplômés
CREATE TABLE IF NOT EXISTS utilisateurs_archives (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    classe_origine VARCHAR(50) NOT NULL,
    specialite VARCHAR(100),
    date_naissance DATE,
    date_entree_bac INTEGER,
    date_certification INTEGER,
    date_inscription TIMESTAMP,
    date_archivage TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    annee_diplome INTEGER,
    nb_validations INTEGER DEFAULT 0
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_archives_annee ON utilisateurs_archives(annee_diplome);
CREATE INDEX IF NOT EXISTS idx_archives_utilisateur_id ON utilisateurs_archives(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_archives_date ON utilisateurs_archives(date_archivage);
CREATE INDEX IF NOT EXISTS idx_archives_nom ON utilisateurs_archives(nom);
CREATE INDEX IF NOT EXISTS idx_archives_prenom ON utilisateurs_archives(prenom);

-- ========================================
-- FONCTION PRINCIPALE : Passage avec archivage
-- ========================================
CREATE OR REPLACE FUNCTION passage_premiere_terminale_avec_archivage()
RETURNS TABLE (
    nb_archives INTEGER,
    nb_passes INTEGER,
    message TEXT
) AS $$
DECLARE
    v_nb_archives INTEGER;
    v_nb_passes INTEGER;
    v_annee_actuelle INTEGER;
BEGIN
    -- Année actuelle pour l'archivage
    v_annee_actuelle := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- 1. Archiver les élèves de Terminale
    WITH archived AS (
        INSERT INTO utilisateurs_archives (
            utilisateur_id, nom, prenom, email, classe_origine,
            specialite, date_naissance, date_entree_bac, date_certification,
            date_inscription, annee_diplome, nb_validations
        )
        SELECT 
            u.id,
            u.nom,
            u.prenom,
            u.email,
            u.classe,
            u.specialite,
            u.date_naissance,
            u.date_entree_bac,
            u.date_certification,
            u.date_inscription,
            v_annee_actuelle,
            COUNT(v.id)
        FROM utilisateurs u
        LEFT JOIN validations v ON u.id = v.utilisateur_id
        WHERE u.classe = 'Terminale'
        GROUP BY u.id
        RETURNING *
    )
    SELECT COUNT(*) INTO v_nb_archives FROM archived;
    
    -- 2. Supprimer les élèves de Terminale (après archivage)
    DELETE FROM utilisateurs WHERE classe = 'Terminale';
    
    -- 3. Faire passer les Premières en Terminale
    WITH passed AS (
        UPDATE utilisateurs
        SET classe = 'Terminale'
        WHERE classe = 'Première'
        RETURNING *
    )
    SELECT COUNT(*) INTO v_nb_passes FROM passed;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
        v_nb_archives,
        v_nb_passes,
        format('%s élève(s) de Terminale archivé(s) et %s élève(s) passé(s) de Première en Terminale', 
               v_nb_archives, v_nb_passes)::TEXT;
        
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VUE : Prévisualisation du passage
-- ========================================
CREATE OR REPLACE VIEW v_preview_passage_terminale AS
SELECT 
    'Terminale' as classe_actuelle,
    'Archives' as destination,
    COUNT(DISTINCT u.id) as nb_eleves,
    COUNT(v.id) as nb_validations_total
FROM utilisateurs u
LEFT JOIN validations v ON u.id = v.utilisateur_id
WHERE u.classe = 'Terminale'
UNION ALL
SELECT 
    'Première' as classe_actuelle,
    'Terminale' as destination,
    COUNT(DISTINCT u.id) as nb_eleves,
    COUNT(v.id) as nb_validations_total
FROM utilisateurs u
LEFT JOIN validations v ON u.id = v.utilisateur_id
WHERE u.classe = 'Première';

-- ========================================
-- VUE : Statistiques des archives
-- ========================================
CREATE OR REPLACE VIEW v_stats_archives AS
SELECT 
    annee_diplome,
    COUNT(*) as nb_diplomes,
    ROUND(AVG(nb_validations), 2) as moyenne_validations,
    MIN(date_archivage) as premiere_archive,
    MAX(date_archivage) as derniere_archive
FROM utilisateurs_archives
GROUP BY annee_diplome
ORDER BY annee_diplome DESC;

-- ========================================
-- VUE : Détails complets des archives
-- ========================================
CREATE OR REPLACE VIEW v_eleves_archives_complet AS
SELECT 
    ua.*,
    COUNT(DISTINCT v.evaluation_id) as nb_evaluations_realisees,
    COUNT(DISTINCT v.item_id) as nb_items_valides,
    ROUND(AVG(v.niveau_validation), 2) as moyenne_niveaux
FROM utilisateurs_archives ua
LEFT JOIN validations v ON ua.utilisateur_id = v.utilisateur_id
GROUP BY ua.id;

-- ========================================
-- FONCTION : Rechercher dans les archives
-- ========================================
CREATE OR REPLACE FUNCTION rechercher_archive(p_recherche TEXT)
RETURNS TABLE (
    id INTEGER,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(255),
    annee_diplome INTEGER,
    nb_validations INTEGER,
    date_archivage TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.id,
        ua.nom,
        ua.prenom,
        ua.email,
        ua.annee_diplome,
        ua.nb_validations,
        ua.date_archivage
    FROM utilisateurs_archives ua
    WHERE 
        LOWER(ua.nom) LIKE LOWER('%' || p_recherche || '%') OR
        LOWER(ua.prenom) LIKE LOWER('%' || p_recherche || '%') OR
        LOWER(ua.email) LIKE LOWER('%' || p_recherche || '%')
    ORDER BY ua.date_archivage DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FONCTION : Restaurer un élève archivé
-- ========================================
CREATE OR REPLACE FUNCTION restaurer_eleve_archive(p_archive_id INTEGER)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_archive RECORD;
BEGIN
    -- Récupérer les infos de l'archive
    SELECT * INTO v_archive
    FROM utilisateurs_archives
    WHERE id = p_archive_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Archive non trouvée'::TEXT;
        RETURN;
    END IF;
    
    -- Vérifier si l'élève n'existe pas déjà
    IF EXISTS (SELECT 1 FROM utilisateurs WHERE id = v_archive.utilisateur_id) THEN
        RETURN QUERY SELECT FALSE, 'Cet élève existe déjà dans les utilisateurs actifs'::TEXT;
        RETURN;
    END IF;
    
    -- Restaurer l'élève
    INSERT INTO utilisateurs (
        id, nom, prenom, email, classe, specialite,
        date_naissance, date_entree_bac, date_certification, date_inscription
    ) VALUES (
        v_archive.utilisateur_id,
        v_archive.nom,
        v_archive.prenom,
        v_archive.email,
        'Terminale', -- Restauré en Terminale
        v_archive.specialite,
        v_archive.date_naissance,
        v_archive.date_entree_bac,
        v_archive.date_certification,
        v_archive.date_inscription
    );
    
    -- Mettre à jour la séquence si nécessaire
    PERFORM setval('utilisateurs_id_seq', 
                   GREATEST((SELECT MAX(id) FROM utilisateurs), 
                           (SELECT last_value FROM utilisateurs_id_seq)));
    
    RETURN QUERY SELECT TRUE, format('Élève %s %s restauré avec succès', v_archive.prenom, v_archive.nom)::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FONCTION : Obtenir l'historique complet d'un élève
-- ========================================
CREATE OR REPLACE FUNCTION get_historique_eleve(p_utilisateur_id INTEGER)
RETURNS TABLE (
    validation_id INTEGER,
    date_validation TIMESTAMP,
    niveau_validation INTEGER,
    commentaire TEXT,
    validateur VARCHAR(100),
    module VARCHAR(100),
    pole VARCHAR(50),
    competence_code VARCHAR(10),
    competence_libelle TEXT,
    item_code VARCHAR(20),
    item_description TEXT,
    est_archive BOOLEAN,
    classe_actuelle VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as validation_id,
        v.date_validation,
        v.niveau_validation,
        v.commentaire,
        v.validateur,
        e.module,
        e.pole,
        c.code as competence_code,
        c.libelle as competence_libelle,
        i.code_item as item_code,
        i.description as item_description,
        EXISTS(SELECT 1 FROM utilisateurs_archives ua WHERE ua.utilisateur_id = p_utilisateur_id) as est_archive,
        COALESCE(u.classe, ua.classe_origine) as classe_actuelle
    FROM validations v
    JOIN evaluations e ON v.evaluation_id = e.id
    JOIN items i ON v.item_id = i.id
    JOIN competences c ON i.competence_id = c.id
    LEFT JOIN utilisateurs u ON v.utilisateur_id = u.id
    LEFT JOIN utilisateurs_archives ua ON v.utilisateur_id = ua.utilisateur_id
    WHERE v.utilisateur_id = p_utilisateur_id
    ORDER BY v.date_validation DESC;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration réussie !';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Système d''archivage installé avec succès';
    RAISE NOTICE 'Tables créées : utilisateurs_archives';
    RAISE NOTICE 'Fonctions disponibles :';
    RAISE NOTICE '  - passage_premiere_terminale_avec_archivage()';
    RAISE NOTICE '  - rechercher_archive(texte)';
    RAISE NOTICE '  - restaurer_eleve_archive(id)';
    RAISE NOTICE '  - get_historique_eleve(utilisateur_id)';
    RAISE NOTICE 'Vues créées :';
    RAISE NOTICE '  - v_preview_passage_terminale';
    RAISE NOTICE '  - v_stats_archives';
    RAISE NOTICE '  - v_eleves_archives_complet';
    RAISE NOTICE '========================================';
END $$;