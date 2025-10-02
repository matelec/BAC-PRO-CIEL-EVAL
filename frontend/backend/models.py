import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime
import os
import time

class Database:
    def __init__(self):
        max_retries = 5
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                self.connection = psycopg2.connect(
                    host=os.getenv('DATABASE_HOST', 'database'),
                    database=os.getenv('DATABASE_NAME', 'bacprociel'),
                    user=os.getenv('DATABASE_USER', 'admin'),
                    password=os.getenv('DATABASE_PASSWORD', 'password'),
                    connect_timeout=10
                )
                print("✅ Connexion à la base de données réussie")
                break
            except Exception as e:
                print(f"❌ Tentative {attempt + 1}/{max_retries} échouée: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    raise e

    # ===== MÉTHODES UTILISATEURS =====
    
    def get_utilisateurs(self):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM utilisateurs ORDER BY nom, prenom")
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_utilisateurs: {str(e)}")
            return []

    def ajouter_utilisateur(self, nom, prenom, email=None, classe=None, date_naissance=None, date_entree_bac=None, date_certification=None, specialite=None):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                if not email:
                    email = f"{prenom.lower().replace(' ', '.')}.{nom.lower().replace(' ', '.')}@bacpro-ciel.fr"

                cursor.execute("""
                    INSERT INTO utilisateurs (nom, prenom, email, classe, date_naissance, date_entree_bac, date_certification, specialite)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
                """, (nom, prenom, email, classe, date_naissance, date_entree_bac, date_certification, specialite))
                
                self.connection.commit()
                return cursor.fetchone()
        except Exception as e:
            print(f"Erreur ajouter_utilisateur: {str(e)}")
            self.connection.rollback()
            return None

    def modifier_utilisateur(self, user_id, nom=None, prenom=None, email=None, classe=None, 
                           date_naissance=None, date_entree_bac=None, date_certification=None, specialite=None):
        """
        Modifie un utilisateur existant
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Vérifier d'abord si l'utilisateur existe
                cursor.execute("SELECT * FROM utilisateurs WHERE id = %s", (user_id,))
                if not cursor.fetchone():
                    print(f"❌ Utilisateur avec ID {user_id} non trouvé")
                    return None

                # Construire la requête dynamiquement en fonction des champs fournis
                updates = []
                params = []
                
                if nom is not None:
                    updates.append("nom = %s")
                    params.append(nom)
                if prenom is not None:
                    updates.append("prenom = %s")
                    params.append(prenom)
                if email is not None:
                    updates.append("email = %s")
                    params.append(email)
                if classe is not None:
                    updates.append("classe = %s")
                    params.append(classe)
                if date_naissance is not None:
                    updates.append("date_naissance = %s")
                    params.append(date_naissance)
                if date_entree_bac is not None:
                    updates.append("date_entree_bac = %s")
                    params.append(date_entree_bac)
                if date_certification is not None:
                    updates.append("date_certification = %s")
                    params.append(date_certification)
                if specialite is not None:
                    updates.append("specialite = %s")
                    params.append(specialite)

                if not updates:
                    print("⚠️ Aucune modification à apporter")
                    return None

                # Ajouter l'ID à la fin des paramètres
                params.append(user_id)
                
                query = f"UPDATE utilisateurs SET {', '.join(updates)} WHERE id = %s RETURNING *"
                cursor.execute(query, params)
                
                utilisateur_modifie = cursor.fetchone()
                self.connection.commit()
                
                print(f"✅ Utilisateur {user_id} modifié avec succès")
                return utilisateur_modifie
                
        except Exception as e:
            print(f"❌ Erreur modification utilisateur {user_id}: {str(e)}")
            self.connection.rollback()
            return None

    def supprimer_utilisateur(self, utilisateur_id):
        """Supprime un utilisateur et cascade ses données liées (evaluations, validations, etc.)"""
        try:
            with self.connection.cursor() as cursor:
                # Vérifier d'abord si l'utilisateur existe
                cursor.execute("SELECT id FROM utilisateurs WHERE id = %s", (utilisateur_id,))
                if not cursor.fetchone():
                    print(f"❌ Utilisateur {utilisateur_id} non trouvé")
                    return False

                cursor.execute("DELETE FROM utilisateurs WHERE id = %s", (utilisateur_id,))
                self.connection.commit()
                
                success = cursor.rowcount > 0
                if success:
                    print(f"✅ Utilisateur {utilisateur_id} supprimé avec succès")
                else:
                    print(f"❌ Échec suppression utilisateur {utilisateur_id}")
                
                return success
        except Exception as e:
            print(f"❌ Erreur suppression utilisateur {utilisateur_id}: {str(e)}")
            self.connection.rollback()
            return False

    def importer_utilisateurs_excel(self, fichier_excel):
        """
        Importe des utilisateurs depuis un fichier Excel
        """
        try:
            print(f"📁 Lecture du fichier: {fichier_excel}")
            df = pd.read_excel(fichier_excel)
            print(f"📊 Données lues: {len(df)} lignes")
        
            # Nettoyage des colonnes
            df.columns = df.columns.str.strip().str.lower()
            print(f"📊 Colonnes détectées: {list(df.columns)}")
        
            # Vérifier si les colonnes essentielles existent
            required_columns = ['nom', 'prenom']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return {
                    'erreur': f"Colonnes manquantes: {', '.join(missing_columns)}",
                    'colonnes_detectees': list(df.columns)
                }
        
            utilisateurs_importes = []
            erreurs = []
            
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                for index, row in df.iterrows():
                    try:
                        nom = self._extraire_valeur(row, ['nom', 'name', 'lastname'])
                        prenom = self._extraire_valeur(row, ['prenom', 'prénom', 'firstname', 'prename'])
                        email = self._extraire_valeur(row, ['email', 'mail', 'courriel'])
                        classe = self._extraire_valeur(row, ['classe', 'class', 'niveau', 'level'])
                        date_naissance = self._extraire_date(row, ['date_naissance', 'date naissance', 'birthdate', 'dn'])
                        date_entree_bac = self._extraire_annee(row, ['date_entree_bac', 'date entree bac', 'entree_bac', 'debut_bac', 'annee_entree'])
                        date_certification = self._extraire_annee(row, ['date_certification', 'date certification', 'certification', 'fin_bac', 'annee_certification'])
                        specialite = self._extraire_valeur(row, ['specialite', 'spécialité', 'option', 'speciality'])

                        if not nom or not prenom:
                            erreurs.append(f"Ligne {index + 2}: Nom et prénom sont obligatoires")
                            continue
                        
                        nom = str(nom).strip().title()
                        prenom = str(prenom).strip().title()
                        
                        if not email:
                            base_email = f"{prenom.lower().replace(' ', '.')}.{nom.lower().replace(' ', '.')}"
                            email = f"{base_email}@bacpro-ciel.fr"
                        else:
                            email = str(email).strip().lower()
                        
                        # Vérifier si l'email existe déjà
                        cursor.execute("SELECT id FROM utilisateurs WHERE email = %s", (email,))
                        if cursor.fetchone():
                            erreurs.append(f"Ligne {index + 2}: L'email {email} existe déjà")
                            continue
                        
                        print(f"✅ Insertion: {nom} {prenom} - {email} - {classe}")

                        cursor.execute("""
                            INSERT INTO utilisateurs (nom, prenom, email, classe, date_naissance, date_entree_bac, date_certification, specialite)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, nom, prenom, email, classe
                        """, (nom, prenom, email, classe, date_naissance, date_entree_bac, date_certification, specialite))
                        
                        nouvel_utilisateur = cursor.fetchone()
                        utilisateurs_importes.append(dict(nouvel_utilisateur))
                        print(f"✅ Utilisateur importé: {prenom} {nom} ({email}) - Classe: {classe}")
                        
                    except Exception as e:
                        erreur_msg = f"Ligne {index + 2}: {str(e)}"
                        erreurs.append(erreur_msg)
                        print(f"❌ {erreur_msg}")
                        continue
                
                self.connection.commit()
                print(f"🎉 Import terminé: {len(utilisateurs_importes)} utilisateurs importés")
                
            return {
                'success': True,
                'utilisateurs_importes': utilisateurs_importes,
                'total_importes': len(utilisateurs_importes),
                'erreurs': erreurs,
                'total_lignes': len(df)
            }
            
        except Exception as e:
            self.connection.rollback()
            error_msg = f"Erreur lors de la lecture du fichier: {str(e)}"
            print(f"❌ {error_msg}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'erreur': error_msg,
                'traceback': traceback.format_exc()
            }

    def _extraire_valeur(self, row, noms_possibles):
        for nom in noms_possibles:
            if nom in row and pd.notna(row[nom]):
                value = row[nom]
                if pd.isna(value) or value == '':
                    return None
                return str(value).strip()
        return None

    def _extraire_date(self, row, noms_possibles):
        for nom in noms_possibles:
            if nom in row and pd.notna(row[nom]):
                try:
                    date_val = row[nom]
                    if pd.isna(date_val) or date_val == '':
                        return None
                    if isinstance(date_val, (datetime, pd.Timestamp)):
                        return date_val.date() if hasattr(date_val, 'date') else date_val
                    if isinstance(date_val, str):
                        date_val = date_val.strip()
                        if not date_val:
                            return None
                        formats = [
                            '%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d',
                            '%d/%m/%y', '%d-%m-%y', '%d %m %Y', '%d %b %Y'
                        ]
                        for fmt in formats:
                            try:
                                return datetime.strptime(date_val, fmt).date()
                            except ValueError:
                                continue
                    print(f"⚠️ Format de date non reconnu: {date_val} (type: {type(date_val)})")
                    return None
                except Exception as e:
                    print(f"❌ Erreur conversion date '{date_val}': {e}")
                    return None
        return None

    def _extraire_annee(self, row, noms_possibles):
        """Extrait une année depuis différentes colonnes possibles"""
        for nom in noms_possibles:
            if nom in row and pd.notna(row[nom]):
                try:
                    annee_val = row[nom]
                    if pd.isna(annee_val) or annee_val == '':
                        return None
                    
                    # Si c'est déjà un nombre
                    if isinstance(annee_val, (int, float)):
                        return int(annee_val)
                    
                    # Si c'est une chaîne de caractères
                    if isinstance(annee_val, str):
                        annee_val = annee_val.strip()
                        if not annee_val:
                            return None
                        # Essayer de convertir directement en entier
                        try:
                            return int(annee_val)
                        except ValueError:
                            # Essayer d'extraire l'année d'une date
                            try:
                                date_obj = datetime.strptime(annee_val, '%Y-%m-%d')
                                return date_obj.year
                            except ValueError:
                                pass
                    
                    print(f"⚠️ Format d'année non reconnu: {annee_val} (type: {type(annee_val)})")
                    return None
                except Exception as e:
                    print(f"❌ Erreur conversion année '{annee_val}': {e}")
                    return None
        return None

    def get_utilisateur_par_id(self, user_id):
        """Récupère un utilisateur spécifique par son ID"""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM utilisateurs WHERE id = %s", (user_id,))
                return cursor.fetchone()
        except Exception as e:
            print(f"Erreur get_utilisateur_par_id: {str(e)}")
            return None

    # ===== MÉTHODES RÉFÉRENTIEL =====
    
    def get_competences(self):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM competences ORDER BY code")
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_competences: {str(e)}")
            return []

    def get_items_par_competence(self, competence_id):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT i.*, c.code as competence_code, c.libelle as competence_libelle
                    FROM items i
                    JOIN competences c ON i.competence_id = c.id
                    WHERE i.competence_id = %s
                    ORDER BY i.code_item
                """, (competence_id,))
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_items_par_competence: {str(e)}")
            return []

    def get_all_items(self):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT i.*, c.code as competence_code, c.libelle as competence_libelle
                    FROM items i
                    JOIN competences c ON i.competence_id = c.id
                    ORDER BY c.code, i.code_item
                """)
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_all_items: {str(e)}")
            return []

    # ===== MÉTHODES ÉVALUATIONS =====
    
    def creer_evaluation(self, pole, module, contexte, items_ids):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    INSERT INTO evaluations (pole, module, contexte)
                    VALUES (%s, %s, %s) RETURNING *
                """, (pole, module, contexte))
                
                evaluation = cursor.fetchone()
                evaluation_id = evaluation['id']
                
                for item_id in items_ids:
                    cursor.execute("""
                        INSERT INTO evaluation_items (evaluation_id, item_id)
                        VALUES (%s, %s)
                    """, (evaluation_id, item_id))
                
                self.connection.commit()
                return evaluation
        except Exception as e:
            print(f"Erreur creer_evaluation: {str(e)}")
            self.connection.rollback()
            return None

    def get_evaluations(self):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT e.*, COUNT(ei.item_id) as nombre_items
                    FROM evaluations e
                    LEFT JOIN evaluation_items ei ON e.id = ei.evaluation_id
                    GROUP BY e.id
                    ORDER BY e.date_creation DESC
                """)
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_evaluations: {str(e)}")
            return []

    def get_evaluation_detail(self, evaluation_id):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM evaluations WHERE id = %s", (evaluation_id,))
                evaluation = cursor.fetchone()
                
                cursor.execute("""
                    SELECT i.*, c.code as competence_code, c.libelle as competence_libelle
                    FROM items i
                    JOIN evaluation_items ei ON i.id = ei.item_id
                    JOIN competences c ON i.competence_id = c.id
                    WHERE ei.evaluation_id = %s
                    ORDER BY c.code, i.code_item
                """, (evaluation_id,))
                items = cursor.fetchall()
                
                return evaluation, items
        except Exception as e:
            print(f"Erreur get_evaluation_detail: {str(e)}")
            return None, []

    def supprimer_evaluation(self, evaluation_id):
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("DELETE FROM evaluations WHERE id = %s", (evaluation_id,))
                self.connection.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Erreur supprimer_evaluation: {str(e)}")
            self.connection.rollback()
            return False

# ===== MÉTHODES ATTRIBUTIONS =====
    
    def attribuer_evaluation(self, evaluation_id, classe=None, utilisateur_id=None):
        """
        Attribue une évaluation à une classe ou à un utilisateur spécifique
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Vérifier que l'évaluation existe
                cursor.execute("SELECT id FROM evaluations WHERE id = %s", (evaluation_id,))
                if not cursor.fetchone():
                    return {'success': False, 'error': 'Évaluation non trouvée'}
                
                # Vérifier que soit classe, soit utilisateur_id est fourni
                if not classe and not utilisateur_id:
                    return {'success': False, 'error': 'Spécifiez une classe ou un utilisateur'}
                
                if classe and utilisateur_id:
                    return {'success': False, 'error': 'Spécifiez soit une classe, soit un utilisateur, pas les deux'}
                
                # Vérifier si l'attribution existe déjà
                if classe:
                    cursor.execute("""
                        SELECT id FROM evaluation_attributions 
                        WHERE evaluation_id = %s AND classe = %s
                    """, (evaluation_id, classe))
                    if cursor.fetchone():
                        return {'success': False, 'error': 'Cette classe est déjà attribuée à cette évaluation'}
                else:
                    cursor.execute("""
                        SELECT id FROM evaluation_attributions 
                        WHERE evaluation_id = %s AND utilisateur_id = %s
                    """, (evaluation_id, utilisateur_id))
                    if cursor.fetchone():
                        return {'success': False, 'error': 'Cet utilisateur est déjà attribué à cette évaluation'}
                
                # Insérer l'attribution
                cursor.execute("""
                    INSERT INTO evaluation_attributions (evaluation_id, classe, utilisateur_id)
                    VALUES (%s, %s, %s) RETURNING *
                """, (evaluation_id, classe, utilisateur_id))
                
                attribution = cursor.fetchone()
                self.connection.commit()
                
                return {'success': True, 'attribution': attribution}
                
        except Exception as e:
            print(f"Erreur attribuer_evaluation: {str(e)}")
            self.connection.rollback()
            return {'success': False, 'error': str(e)}

    def retirer_attribution(self, attribution_id):
        """
        Retire une attribution d'évaluation
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("DELETE FROM evaluation_attributions WHERE id = %s RETURNING id", (attribution_id,))
                result = cursor.fetchone()
                self.connection.commit()
                
                if result:
                    return {'success': True, 'message': 'Attribution retirée avec succès'}
                else:
                    return {'success': False, 'error': 'Attribution non trouvée'}
                    
        except Exception as e:
            print(f"Erreur retirer_attribution: {str(e)}")
            self.connection.rollback()
            return {'success': False, 'error': str(e)}

    def get_attributions_evaluation(self, evaluation_id):
        """
        Récupère toutes les attributions d'une évaluation
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT ea.*, u.nom, u.prenom, u.classe as user_classe
                    FROM evaluation_attributions ea
                    LEFT JOIN utilisateurs u ON ea.utilisateur_id = u.id
                    WHERE ea.evaluation_id = %s
                    ORDER BY 
                        CASE WHEN ea.classe IS NOT NULL THEN 1 ELSE 2 END,
                        ea.classe, u.nom, u.prenom
                """, (evaluation_id,))
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_attributions_evaluation: {str(e)}")
            return []

    def get_utilisateurs_concernes_par_evaluation(self, evaluation_id):
        """
        Récupère tous les utilisateurs concernés par une évaluation
        (via attribution par classe ou par utilisateur)
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    -- Utilisateurs via attribution directe
                    SELECT DISTINCT u.*
                    FROM utilisateurs u
                    JOIN evaluation_attributions ea ON u.id = ea.utilisateur_id
                    WHERE ea.evaluation_id = %s
                    
                    UNION
                    
                    -- Utilisateurs via attribution par classe
                    SELECT DISTINCT u.*
                    FROM utilisateurs u
                    JOIN evaluation_attributions ea ON u.classe = ea.classe
                    WHERE ea.evaluation_id = %s AND ea.classe IS NOT NULL
                    
                    ORDER BY nom, prenom
                """, (evaluation_id, evaluation_id))
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_utilisateurs_concernes_par_evaluation: {str(e)}")
            return []

    def modifier_evaluation(self, evaluation_id, module=None, contexte=None):
        """
        Modifie les informations d'une évaluation
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                updates = []
                params = []
                
                if module is not None:
                    updates.append("module = %s")
                    params.append(module)
                if contexte is not None:
                    updates.append("contexte = %s")
                    params.append(contexte)
                
                if not updates:
                    return {'success': False, 'error': 'Aucune modification spécifiée'}
                
                params.append(evaluation_id)
                query = f"UPDATE evaluations SET {', '.join(updates)} WHERE id = %s RETURNING *"
                
                cursor.execute(query, params)
                evaluation_modifiee = cursor.fetchone()
                self.connection.commit()
                
                if evaluation_modifiee:
                    return {'success': True, 'evaluation': evaluation_modifiee}
                else:
                    return {'success': False, 'error': 'Évaluation non trouvée'}
                    
        except Exception as e:
            print(f"Erreur modifier_evaluation: {str(e)}")
            self.connection.rollback()
            return {'success': False, 'error': str(e)}
            
    # ===== MÉTHODES VALIDATIONS =====
    
    def mettre_a_jour_validation(self, utilisateur_id, evaluation_id, item_id, niveau, commentaire, validateur):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    INSERT INTO validations (utilisateur_id, evaluation_id, item_id, niveau_validation, commentaire, validateur)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (utilisateur_id, evaluation_id, item_id)
                    DO UPDATE SET niveau_validation = EXCLUDED.niveau_validation,
                                 commentaire = EXCLUDED.commentaire,
                                 validateur = EXCLUDED.validateur,
                                 date_validation = CURRENT_TIMESTAMP
                    RETURNING *
                """, (utilisateur_id, evaluation_id, item_id, niveau, commentaire, validateur))
                
                self.connection.commit()
                return cursor.fetchone()
        except Exception as e:
            print(f"Erreur mettre_a_jour_validation: {str(e)}")
            self.connection.rollback()
            return None

    def get_validations_utilisateur(self, utilisateur_id, evaluation_id=None):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                    SELECT v.*, i.code_item, i.sous_item, i.description as item_description,
                           c.code as competence_code, c.libelle as competence_libelle,
                           e.module as evaluation_module, e.contexte as evaluation_contexte
                    FROM validations v
                    JOIN items i ON v.item_id = i.id
                    JOIN competences c ON i.competence_id = c.id
                    JOIN evaluations e ON v.evaluation_id = e.id
                    WHERE v.utilisateur_id = %s
                """
                params = [utilisateur_id]
                
                if evaluation_id:
                    query += " AND v.evaluation_id = %s"
                    params.append(evaluation_id)
                
                query += " ORDER BY e.date_creation DESC, c.code, i.code_item"
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_validations_utilisateur: {str(e)}")
            return []

    def get_validations_par_evaluation(self, evaluation_id):
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT v.*, u.nom, u.prenom, u.classe,
                           i.code_item, i.description as item_description,
                           c.code as competence_code
                    FROM validations v
                    JOIN utilisateurs u ON v.utilisateur_id = u.id
                    JOIN items i ON v.item_id = i.id
                    JOIN competences c ON i.competence_id = c.id
                    WHERE v.evaluation_id = %s
                    ORDER BY u.nom, u.prenom, c.code, i.code_item
                """, (evaluation_id,))
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_validations_par_evaluation: {str(e)}")
            return []

# Dans votre classe Database, ajoutez ces méthodes :

    def ajouter_items_evaluation(self, evaluation_id, items_ids):
        """Ajouter des items à une évaluation"""
        try:
            # Récupérer l'évaluation
            evaluation = self.get_evaluation_detail(evaluation_id)
            if not evaluation:
                return {'success': False, 'error': 'Évaluation non trouvée'}
            
            # Récupérer les items actuels
            evaluation_data, current_items = evaluation
            current_item_ids = [item['id'] for item in current_items]
            
            # Ajouter les nouveaux items
            new_items = list(set(current_item_ids + items_ids))
            
            # Mettre à jour l'évaluation
            success = self.modifier_evaluation_items(evaluation_id, new_items)
            
            if success:
                return {'success': True, 'message': f'{len(items_ids)} item(s) ajouté(s)'}
            else:
                return {'success': False, 'error': 'Erreur lors de l\'ajout des items'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def retirer_item_evaluation(self, evaluation_id, item_id):
        """Retirer un item d'une évaluation"""
        try:
            # Récupérer l'évaluation
            evaluation = self.get_evaluation_detail(evaluation_id)
            if not evaluation:
                return {'success': False, 'error': 'Évaluation non trouvée'}
            
            # Récupérer les items actuels
            evaluation_data, current_items = evaluation
            current_item_ids = [item['id'] for item in current_items]
            
            # Vérifier si l'item existe dans l'évaluation
            if item_id not in current_item_ids:
                return {'success': False, 'error': 'Item non trouvé dans cette évaluation'}
            
            # Retirer l'item
            current_item_ids.remove(item_id)
            
            # Mettre à jour l'évaluation
            success = self.modifier_evaluation_items(evaluation_id, current_item_ids)
            
            if success:
                # Supprimer les validations associées à cet item
                self.supprimer_validations_item(evaluation_id, item_id)
                return {'success': True, 'message': 'Item retiré avec succès'}
            else:
                return {'success': False, 'error': 'Erreur lors du retrait de l\'item'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def modifier_evaluation_items(self, evaluation_id, items_ids):
        """Modifier les items d'une évaluation - VERSION POSTGRESQL CORRIGÉE"""
        try:
            with self.connection.cursor() as cursor:
                print(f"🔄 Mise à jour items évaluation {evaluation_id} avec {len(items_ids)} items")
                
                # 1. Supprimer les anciennes associations
                cursor.execute("DELETE FROM evaluation_items WHERE evaluation_id = %s", (evaluation_id,))
                deleted_count = cursor.rowcount
                print(f"✅ {deleted_count} anciennes associations supprimées")
                
                # 2. Ajouter les nouvelles associations
                inserted_count = 0
                for item_id in items_ids:
                    try:
                        cursor.execute(
                            "INSERT INTO evaluation_items (evaluation_id, item_id) VALUES (%s, %s)",
                            (evaluation_id, item_id)
                        )
                        inserted_count += 1
                    except Exception as e:
                        print(f"  ❌ Erreur insertion item {item_id}: {e}")
                
                self.connection.commit()
                print(f"✅ Évaluation {evaluation_id} mise à jour: {inserted_count}/{len(items_ids)} items insérés")
                return inserted_count > 0  # Retourne True si au moins un item a été inséré
            
        except Exception as e:
            print(f"❌ Erreur PostgreSQL mise à jour items: {e}")
            self.connection.rollback()
            return False

    def supprimer_validations_item(self, evaluation_id, item_id):
        """Supprimer les validations pour un item spécifique - VERSION POSTGRESQL CORRIGÉE"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM validations WHERE evaluation_id = %s AND item_id = %s",
                    (evaluation_id, item_id)
                )
                deleted_count = cursor.rowcount
                self.connection.commit()
                print(f"✅ {deleted_count} validation(s) supprimée(s) pour évaluation {evaluation_id}, item {item_id}")
                return True
        except Exception as e:
            print(f"❌ Erreur suppression validations: {e}")
            self.connection.rollback()
            return False           

    def get_user_profile(self, user_id):
        """Récupère le profil complet d'un utilisateur avec ses compétences"""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # 1. Récupérer les informations de base de l'utilisateur
                cursor.execute("""
                    SELECT id, nom, prenom, email, classe, specialite, 
                        date_naissance, date_entree_bac, date_certification
                    FROM utilisateurs 
                    WHERE id = %s
                """, (user_id,))
                user = cursor.fetchone()
                
                if not user:
                    return None
                
                # 2. Récupérer les statistiques par compétence
                cursor.execute("""
                    SELECT 
                        c.id as competence_id,
                        c.code as competence_code,
                        c.libelle as competence_libelle,
                        COUNT(v.id) as nb_validations,
                        COALESCE(SUM(v.niveau_validation), 0) as total_niveaux,
                        COALESCE(ROUND(AVG(v.niveau_validation)::numeric, 2), 0) as niveau_moyen,
                        -- Calcul du nombre d'évaluations en Première pour cette compétence
                        (
                            SELECT COUNT(DISTINCT e.id)
                            FROM evaluations e
                            JOIN evaluation_items ei ON e.id = ei.evaluation_id
                            JOIN items i2 ON ei.item_id = i2.id
                            JOIN evaluation_attributions ea ON e.id = ea.evaluation_id
                            WHERE i2.competence_id = c.id
                            AND ea.classe = 'Première'
                        ) as nb_eval_premiere,
                        -- Calcul du nombre d'évaluations en Terminale pour cette compétence
                        (
                            SELECT COUNT(DISTINCT e.id)
                            FROM evaluations e
                            JOIN evaluation_items ei ON e.id = ei.evaluation_id
                            JOIN items i2 ON ei.item_id = i2.id
                            JOIN evaluation_attributions ea ON e.id = ea.evaluation_id
                            WHERE i2.competence_id = c.id
                            AND ea.classe = 'Terminale'
                        ) as nb_eval_terminale

                    FROM competences c
                    LEFT JOIN items i ON i.competence_id = c.id
                    LEFT JOIN validations v ON v.item_id = i.id AND v.utilisateur_id = %s
                    GROUP BY c.id, c.code, c.libelle
                    ORDER BY c.code
                """, (user_id,))
                
                competences = cursor.fetchall()
                
                # 3. Calculer le statut pour chaque compétence
                competences_list = []
                for comp in competences:
                    total = comp['total_niveaux']
                    nb_validations = comp['nb_validations']
                    niveau_moyen = float(comp['niveau_moyen'])
                    
                    # Calcul du statut
                    if nb_validations == 0:
                        statut = "Non évalué"
                        statut_class = "status-not-evaluated"
                    elif total >= 12 and niveau_moyen >= 3:
                        statut = "Maîtrisé"
                        statut_class = "status-mastered"
                    elif total >= 8 and niveau_moyen >= 2:
                        statut = "En cours"
                        statut_class = "status-in-progress"
                    else:
                        statut = "À travailler"
                        statut_class = "status-to-work"
                    
                    competences_list.append({
                        'competence_id': comp['competence_id'],
                        'competence_code': comp['competence_code'],
                        'competence_libelle': comp['competence_libelle'],
                        'nb_eval_premiere': comp['nb_eval_premiere'],
                        'nb_eval_terminale': comp['nb_eval_terminale'],
                        'total_niveaux': int(comp['total_niveaux']),
                        'nb_validations': comp['nb_validations'],
                        'niveau_moyen': niveau_moyen,
                        'statut': statut,
                        'statut_class': statut_class
                    })
                
                return {
                    'user': dict(user),
                    'competences': competences_list
                }
                
        except Exception as e:
            print(f"Erreur get_user_profile: {str(e)}")
            return None 

    # À ajouter dans votre classe Database (models.py)

# ===== MÉTHODES PASSAGE DE CLASSE ET ARCHIVAGE =====

    def get_preview_passage_terminale(self):
        """Récupère l'aperçu des passages de classe"""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM v_preview_passage_terminale ORDER BY classe_actuelle")
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_preview_passage_terminale: {str(e)}")
            return []

    def passage_premiere_terminale_avec_archivage(self):
        """
        Archive les élèves de Terminale et fait passer les Première en Terminale
        Retourne: dict avec nb_archives, nb_passes, message
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM passage_premiere_terminale_avec_archivage()")
                result = cursor.fetchone()
                self.connection.commit()
                
                if result:
                    return {
                        'success': True,
                        'nb_archives': result['nb_archives'],
                        'nb_passes': result['nb_passes'],
                        'message': result['message']
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Aucune donnée retournée'
                    }
                    
        except Exception as e:
            print(f"Erreur passage_premiere_terminale_avec_archivage: {str(e)}")
            self.connection.rollback()
            return {
                'success': False,
                'error': str(e)
            }

    def get_archives(self, annee=None, limit=100, offset=0):
        """
        Récupère la liste des élèves archivés
        Args:
            annee: Filtrer par année de diplôme (optionnel)
            limit: Nombre max de résultats
            offset: Décalage pour pagination
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                if annee:
                    cursor.execute("""
                        SELECT * FROM utilisateurs_archives
                        WHERE annee_diplome = %s
                        ORDER BY date_archivage DESC, nom, prenom
                        LIMIT %s OFFSET %s
                    """, (annee, limit, offset))
                    
                    cursor.execute("""
                        SELECT COUNT(*) as total FROM utilisateurs_archives
                        WHERE annee_diplome = %s
                    """, (annee,))
                else:
                    cursor.execute("""
                        SELECT * FROM utilisateurs_archives
                        ORDER BY date_archivage DESC, nom, prenom
                        LIMIT %s OFFSET %s
                    """, (limit, offset))
                    
                    cursor.execute("SELECT COUNT(*) as total FROM utilisateurs_archives")
                
                archives = cursor.fetchall()
                total = cursor.fetchone()['total']
                
                return {
                    'archives': archives,
                    'total': total,
                    'limit': limit,
                    'offset': offset
                }
                
        except Exception as e:
            print(f"Erreur get_archives: {str(e)}")
            return {
                'archives': [],
                'total': 0,
                'limit': limit,
                'offset': offset
            }

    def get_stats_archives(self):
        """Récupère les statistiques des archives par promotion"""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM v_stats_archives")
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur get_stats_archives: {str(e)}")
            return []

    def rechercher_archive(self, recherche):
        """
        Recherche dans les archives par nom, prénom ou email
        Args:
            recherche: Terme de recherche
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM rechercher_archive(%s)", (recherche,))
                return cursor.fetchall()
        except Exception as e:
            print(f"Erreur rechercher_archive: {str(e)}")
            return []

    def get_archive_detail(self, archive_id):
        """
        Récupère les détails complets d'un élève archivé
        Args:
            archive_id: ID de l'archive
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Infos générales de l'archive
                cursor.execute("""
                    SELECT * FROM v_eleves_archives_complet
                    WHERE id = %s
                """, (archive_id,))
                archive = cursor.fetchone()
                
                if not archive:
                    return None
                
                # Toutes les validations de cet élève
                cursor.execute("""
                    SELECT 
                        v.id,
                        v.niveau_validation,
                        v.commentaire,
                        v.date_validation,
                        v.validateur,
                        e.module,
                        e.pole,
                        c.code as competence_code,
                        c.libelle as competence_libelle,
                        i.code_item,
                        i.description as item_description
                    FROM validations v
                    JOIN evaluations e ON v.evaluation_id = e.id
                    JOIN items i ON v.item_id = i.id
                    JOIN competences c ON i.competence_id = c.id
                    WHERE v.utilisateur_id = %s
                    ORDER BY v.date_validation DESC
                """, (archive['utilisateur_id'],))
                
                validations = cursor.fetchall()
                
                return {
                    'archive': archive,
                    'validations': validations
                }
                
        except Exception as e:
            print(f"Erreur get_archive_detail: {str(e)}")
            return None

    def restaurer_eleve_archive(self, archive_id):
        """
        Restaure un élève archivé dans les utilisateurs actifs
        Args:
            archive_id: ID de l'archive à restaurer
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM restaurer_eleve_archive(%s)", (archive_id,))
                result = cursor.fetchone()
                self.connection.commit()
                
                return {
                    'success': result['success'],
                    'message': result['message']
                }
                
        except Exception as e:
            print(f"Erreur restaurer_eleve_archive: {str(e)}")
            self.connection.rollback()
            return {
                'success': False,
                'error': str(e)
            }

    def get_historique_eleve(self, utilisateur_id):
        """
        Récupère l'historique complet d'un élève (actif ou archivé)
        Args:
            utilisateur_id: ID de l'utilisateur
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Vérifier si l'élève existe (actif ou archivé)
                cursor.execute("""
                    SELECT 
                        u.id, u.nom, u.prenom, u.classe, 'actif' as statut
                    FROM utilisateurs u
                    WHERE u.id = %s
                    UNION ALL
                    SELECT 
                        ua.utilisateur_id as id, ua.nom, ua.prenom, 
                        ua.classe_origine as classe, 'archivé' as statut
                    FROM utilisateurs_archives ua
                    WHERE ua.utilisateur_id = %s
                """, (utilisateur_id, utilisateur_id))
                
                user = cursor.fetchone()
                
                if not user:
                    return None
                
                # Récupérer l'historique complet
                cursor.execute("SELECT * FROM get_historique_eleve(%s)", (utilisateur_id,))
                validations = cursor.fetchall()
                
                return {
                    'utilisateur': user,
                    'validations': validations,
                    'total_validations': len(validations)
                }
                
        except Exception as e:
            print(f"Erreur get_historique_eleve: {str(e)}")
            return None

    def exporter_archives_csv(self, annee=None):
        """
        Génère un CSV des archives
        Args:
            annee: Filtrer par année (optionnel)
        Returns:
            string: Contenu CSV
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                if annee:
                    cursor.execute("""
                        SELECT 
                            ua.nom, ua.prenom, ua.email, ua.classe_origine,
                            ua.specialite, ua.annee_diplome, ua.nb_validations,
                            ua.date_archivage,
                            COUNT(DISTINCT v.evaluation_id) as nb_evaluations,
                            ROUND(AVG(v.niveau_validation)::numeric, 2) as moyenne_validation
                        FROM utilisateurs_archives ua
                        LEFT JOIN validations v ON ua.utilisateur_id = v.utilisateur_id
                        WHERE ua.annee_diplome = %s
                        GROUP BY ua.id
                        ORDER BY ua.nom, ua.prenom
                    """, (annee,))
                else:
                    cursor.execute("""
                        SELECT 
                            ua.nom, ua.prenom, ua.email, ua.classe_origine,
                            ua.specialite, ua.annee_diplome, ua.nb_validations,
                            ua.date_archivage,
                            COUNT(DISTINCT v.evaluation_id) as nb_evaluations,
                            ROUND(AVG(v.niveau_validation)::numeric, 2) as moyenne_validation
                        FROM utilisateurs_archives ua
                        LEFT JOIN validations v ON ua.utilisateur_id = v.utilisateur_id
                        GROUP BY ua.id
                        ORDER BY ua.annee_diplome DESC, ua.nom, ua.prenom
                    """)
                
                archives = cursor.fetchall()
                
                # Générer le CSV
                csv_lines = [
                    'Nom;Prénom;Email;Classe;Spécialité;Année diplôme;Nb validations;Nb évaluations;Moyenne validation;Date archivage'
                ]
                
                for archive in archives:
                    date_archivage = archive['date_archivage'].strftime('%d/%m/%Y') if archive['date_archivage'] else ''
                    line = ';'.join([
                        str(archive['nom'] or ''),
                        str(archive['prenom'] or ''),
                        str(archive['email'] or ''),
                        str(archive['classe_origine'] or ''),
                        str(archive['specialite'] or ''),
                        str(archive['annee_diplome'] or ''),
                        str(archive['nb_validations'] or '0'),
                        str(archive['nb_evaluations'] or '0'),
                        str(archive['moyenne_validation'] or '0'),
                        date_archivage
                    ])
                    csv_lines.append(line)
                
                return '\n'.join(csv_lines)
                
        except Exception as e:
            print(f"Erreur exporter_archives_csv: {str(e)}")
            return None                   