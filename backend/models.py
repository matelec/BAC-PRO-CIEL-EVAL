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