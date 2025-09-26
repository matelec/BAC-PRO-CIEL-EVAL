-- Suppression des tables si elles existent (pour permettre une réinitialisation complète)
DROP TABLE IF EXISTS validations CASCADE;
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
('Moreau', 'Thomas', 'thomas.moreau@bacpro-ciel.fr', 'Terminale', 'BP CIEL');

-- Évaluations d'exemple
INSERT INTO evaluations (module, contexte, date_creation) VALUES
('Projet communication professionnelle', 'Évaluation des compétences en communication dans le cadre du projet semestriel - Présentation orale et écrite', NOW()),
('TP installation réseau', 'Travaux pratiques d''installation et configuration d''un réseau local entreprise', NOW()),
('Développement application web', 'Projet de développement d''une application web avec base de données', NOW()),
('Maintenance système', 'Atelier de maintenance préventive et corrective sur parc informatique', NOW());

-- Lier des items aux évaluations (exemples)
INSERT INTO evaluation_items (evaluation_id, item_id) VALUES
-- Évaluation 1 (Communication) - Items C01
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),

-- Validations d'exemple
INSERT INTO validations (utilisateur_id, evaluation_id, item_id, niveau_validation, commentaire, validateur) VALUES
(1, 1, 1, 3, 'Très bonne présentation, supports de qualité', 'M. Durand'),
(1, 1, 2, 4, 'Expression orale excellente, très à l''aise', 'M. Durand'),
(1, 1, 3, 2, 'Argumentation correcte mais pourrait être plus développée', 'M. Durand'),
(2, 1, 1, 3, 'Bonne présentation, soignée', 'M. Durand'),
(2, 1, 2, 3, 'Expression claire, bon support', 'M. Durand'),
(3, 2, 15, 2, 'Bonne identification des besoins', 'Mme Martin'),
(3, 2, 16, 3, 'Maîtrise des outils d''analyse', 'Mme Martin'),
(4, 3, 36, 4, 'Excellente mise en œuvre des environnements', 'M. Lefebvre'),
(4, 3, 37, 3, 'Débogage efficace', 'M. Lefebvre');

-- Index pour améliorer les performances
CREATE INDEX idx_items_competence_id ON items(competence_id);
CREATE INDEX idx_evaluation_items_evaluation_id ON evaluation_items(evaluation_id);
CREATE INDEX idx_evaluation_items_item_id ON evaluation_items(item_id);
CREATE INDEX idx_validations_utilisateur_id ON validations(utilisateur_id);
CREATE INDEX idx_validations_evaluation_id ON validations(evaluation_id);
CREATE INDEX idx_validations_item_id ON validations(item_id);

-- Message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE 'Base de données initialisée avec succès!';
END $$;