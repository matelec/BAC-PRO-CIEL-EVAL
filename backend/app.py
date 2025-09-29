from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from models import Database
import os, sys, json
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration pour l'upload de fichiers
UPLOAD_FOLDER = '/app/uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

# Créer le dossier d'upload s'il n'existe pas
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = Database()
    
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ✅ ROUTE RACINE
@app.route('/')
def hello():
    return jsonify({
        "message": "API Bac Pro CIEL - Gestion des compétences",
        "version": "2.0",
        "structure": "Nom, Prenom, Email, Date_naissance, Date_entree_bac, Date_certification"
    })

# ===== ROUTES UTILISATEURS =====
@app.route('/api/utilisateurs', methods=['GET'])
def get_utilisateurs():
    try:
        utilisateurs = db.get_utilisateurs()
        return jsonify([dict(u) for u in utilisateurs])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/utilisateurs', methods=['POST'])
def ajouter_utilisateur():
    try:
        data = request.get_json()
        
        # Validation des champs obligatoires
        if not data.get('nom') or not data.get('prenom'):
            return jsonify({"error": "Nom et prénom sont obligatoires"}), 400
        
        nouvel_utilisateur = db.ajouter_utilisateur(
            nom=data['nom'],
            prenom=data['prenom'],
            email=data.get('email'),
            classe=data.get('classe'),
            date_naissance=data.get('date_naissance'),
            date_entree_bac=data.get('date_entree_bac'),
            date_certification=data.get('date_certification')
        )
        
        if nouvel_utilisateur:
            return jsonify(dict(nouvel_utilisateur)), 201
        else:
            return jsonify({"error": "Erreur lors de l'ajout de l'utilisateur"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/utilisateurs/<int:user_id>', methods=['PUT'])
def modifier_utilisateur(user_id):
    try:
        data = request.get_json()
        print(f"🔍 Modification utilisateur ID: {user_id}, Données: {data}")  # Debug
        
        # Validation des données
        if not data:
            return jsonify({"success": False, "error": "Aucune donnée fournie"}), 400
        
        # Appeler la méthode de modification dans la base de données
        utilisateur_modifie = db.modifier_utilisateur(
            user_id=user_id,
            nom=data.get('nom'),
            prenom=data.get('prenom'),
            email=data.get('email'),
            classe=data.get('classe'),
            date_naissance=data.get('date_naissance'),
            date_entree_bac=data.get('date_entree_bac'),
            date_certification=data.get('date_certification'),
            specialite=data.get('specialite')
        )
        
        if utilisateur_modifie:
            print("✅ Utilisateur modifié avec succès")
            return jsonify({
                "success": True, 
                "message": "Utilisateur modifié avec succès",
                "utilisateur": dict(utilisateur_modifie)
            })
        else:
            print("❌ Utilisateur non trouvé ou erreur de modification")
            return jsonify({"success": False, "error": "Utilisateur non trouvé ou erreur de modification"}), 404
            
    except Exception as e:
        print(f"💥 Erreur lors de la modification: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/utilisateurs/<int:user_id>', methods=['DELETE'])
def supprimer_utilisateur(user_id):
    try:
        print(f"🔍 Tentative de suppression de l'utilisateur ID: {user_id}")  # Debug
        
        success = db.supprimer_utilisateur(user_id)
        
        if success:
            print("✅ Utilisateur supprimé avec succès")
            return jsonify({"success": True, "message": "Utilisateur supprimé avec succès"})
        
        print("❌ Utilisateur non trouvé")
        return jsonify({"success": False, "error": "Utilisateur non trouvé"}), 404
        
    except Exception as e:
        print(f"💥 Erreur lors de la suppression: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/modifier_utilisateur', methods=['POST'])
def modifier_utilisateur_form():
    """Route alternative pour la modification via formulaire HTML"""
    try:
        # Récupérer les données du formulaire
        user_id = request.form.get('user_id')
        if not user_id:
            return jsonify({"success": False, "error": "ID utilisateur manquant"}), 400
        
        # Convertir en entier
        user_id = int(user_id)
        
        print(f"🔍 Modification formulaire - ID: {user_id}, Données: {dict(request.form)}")  # Debug
        
        # Appeler la méthode de modification
        utilisateur_modifie = db.modifier_utilisateur(
            user_id=user_id,
            nom=request.form.get('nom'),
            prenom=request.form.get('prenom'),
            email=request.form.get('email'),
            classe=request.form.get('classe'),
            date_naissance=request.form.get('date_naissance'),
            date_entree_bac=request.form.get('date_entree_bac'),
            date_certification=request.form.get('date_certification'),
            specialite=request.form.get('specialite')
        )
        
        if utilisateur_modifie:
            return jsonify({
                "success": True, 
                "message": "Utilisateur modifié avec succès"
            })
        else:
            return jsonify({"success": False, "error": "Utilisateur non trouvé"}), 404
            
    except Exception as e:
        print(f"💥 Erreur lors de la modification formulaire: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/supprimer_utilisateur', methods=['POST'])
def supprimer_utilisateur_form():
    """Route alternative pour la suppression via formulaire HTML"""
    try:
        data = request.get_json()
        if not data or 'user_id' not in data:
            return jsonify({"success": False, "error": "ID utilisateur manquant"}), 400
        
        user_id = int(data['user_id'])
        print(f"🔍 Suppression formulaire - ID: {user_id}")  # Debug
        
        success = db.supprimer_utilisateur(user_id)
        
        if success:
            return jsonify({"success": True, "message": "Utilisateur supprimé avec succès"})
        else:
            return jsonify({"success": False, "error": "Utilisateur non trouvé"}), 404
            
    except Exception as e:
        print(f"💥 Erreur lors de la suppression formulaire: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/utilisateurs/import-excel', methods=['POST'])
def importer_utilisateurs_excel():
    print("🔍 Début import Excel")
    
    if 'file' not in request.files:
        print("❌ Aucun fichier dans la requête")
        return jsonify({"success": False, "error": "Aucun fichier fourni"}), 400
    
    file = request.files['file']
    print(f"📁 Fichier reçu: {file.filename}")
    
    if file.filename == '':
        print("❌ Nom de fichier vide")
        return jsonify({"success": False, "error": "Aucun fichier sélectionné"}), 400

    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            print(f"💾 Sauvegarde vers: {filepath}")
            
            file.save(filepath)
            
            # Vérifier que le fichier existe et a une taille > 0
            if not os.path.exists(filepath):
                return jsonify({"success": False, "error": "Erreur lors de la sauvegarde du fichier"}), 500
                
            file_size = os.path.getsize(filepath)
            print(f"📊 Taille du fichier: {file_size} bytes")
            
            if file_size == 0:
                return jsonify({"success": False, "error": "Le fichier est vide"}), 400
            
            resultat = db.importer_utilisateurs_excel(filepath)
            print(f"🎯 Résultat import: {resultat}")
            
            # Nettoyer le fichier après traitement
            if os.path.exists(filepath):
                os.remove(filepath)
                print("🗑️ Fichier temporaire supprimé")
            
            # Vérifier le résultat
            if resultat.get('success', False):
                return jsonify(resultat), 200
            else:
                return jsonify(resultat), 500
            
        except Exception as e:
            import traceback
            traceback_str = traceback.format_exc()
            print(f"💥 Erreur import-excel: {traceback_str}", flush=True)
            
            # Nettoyer le fichier en cas d'erreur
            if 'filepath' in locals() and os.path.exists(filepath):
                os.remove(filepath)
                
            return jsonify({
                "success": False,
                "error": str(e), 
                "traceback": traceback_str
            }), 500
    
    return jsonify({"success": False, "error": "Type de fichier non autorisé. Utilisez .xlsx ou .xls"}), 400


# ===== ROUTES RÉFÉRENTIEL =====
@app.route('/api/competences', methods=['GET'])
def get_competences():
    try:
        competences = db.get_competences()
        return jsonify([dict(c) for c in competences])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        items = db.get_all_items()
        return jsonify([dict(i) for i in items])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== ROUTES ÉVALUATIONS =====
@app.route('/api/evaluations', methods=['GET'])
def get_evaluations():
    try:
        evaluations = db.get_evaluations()
        return jsonify([dict(e) for e in evaluations])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/evaluations', methods=['POST'])
def creer_evaluation():
    print("🎯 ROUTE /api/evaluations APPELÉE !", flush=True)  # Ce print doit absolument apparaître
    try:
        data = request.get_json()
        print(f"🔍 Création évaluation - Données: {data}")  # Debug


         # Vérifier que les champs obligatoires sont présents
        if not data.get('pole'):
            return jsonify({"error": "Le pôle est obligatoire"}), 400
        if not data.get('module'):
            return jsonify({"error": "Le module est obligatoire"}), 400
        if not data.get('items_ids'):
            return jsonify({"error": "Au moins un item est requis"}), 400

        evaluation = db.creer_evaluation(
            pole=data['pole'],
            module=data['module'],
            contexte=data.get('contexte', ''),
            items_ids=data['items_ids']
        )

        if evaluation:
            return jsonify(dict(evaluation)), 201
        else:
            return jsonify({"error": "Erreur lors de la création de l'évaluation"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/evaluations/<int:evaluation_id>', methods=['GET'])
def get_evaluation_detail(evaluation_id):
    try:
        evaluation, items = db.get_evaluation_detail(evaluation_id)
        return jsonify({
            'evaluation': dict(evaluation) if evaluation else {},
            'items': [dict(i) for i in items]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/evaluations/<int:evaluation_id>', methods=['DELETE'])
def supprimer_evaluation(evaluation_id):
    try:
        success = db.supprimer_evaluation(evaluation_id)
        if success:
            return jsonify({"message": "Évaluation supprimée avec succès"})
        return jsonify({"error": "Évaluation non trouvée"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== ROUTES VALIDATIONS =====
@app.route('/api/validations', methods=['POST'])
def mettre_a_jour_validation():
    try:
        data = request.get_json()

        validation = db.mettre_a_jour_validation(
            data['utilisateur_id'],
            data['evaluation_id'],
            data['item_id'],
            data['niveau_validation'],
            data.get('commentaire', ''),
            data.get('validateur', 'Enseignant')
        )
        return jsonify(dict(validation))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/utilisateurs/<int:utilisateur_id>/validations', methods=['GET'])
def get_validations_utilisateur(utilisateur_id):
    try:
        evaluation_id = request.args.get('evaluation_id')
        validations = db.get_validations_utilisateur(utilisateur_id, evaluation_id)
        return jsonify([dict(v) for v in validations])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/evaluations/<int:evaluation_id>/validations', methods=['GET'])
def get_validations_evaluation(evaluation_id):
    try:
        validations = db.get_validations_par_evaluation(evaluation_id)
        return jsonify([dict(v) for v in validations])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== ROUTES ATTRIBUTIONS ET GESTION ÉVALUATIONS =====

@app.route('/api/attribuer-evaluation', methods=['POST'])
def api_attribuer_evaluation():
    try:
        data = request.get_json()
        result = db.attribuer_evaluation(
            evaluation_id=data.get('evaluation_id'),
            classe=data.get('classe'),
            utilisateur_id=data.get('utilisateur_id')
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/retirer-attribution', methods=['POST'])
def api_retirer_attribution():
    try:
        data = request.get_json()
        result = db.retirer_attribution(data.get('attribution_id'))
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/modifier-evaluation', methods=['POST'])
def api_modifier_evaluation():
    try:
        data = request.get_json()
        result = db.modifier_evaluation(
            evaluation_id=data.get('evaluation_id'),
            module=data.get('module'),
            contexte=data.get('contexte')
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/supprimer-evaluation', methods=['POST'])
def api_supprimer_evaluation():
    try:
        data = request.get_json()
        success = db.supprimer_evaluation(data.get('evaluation_id'))
        return jsonify({'success': success})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/evaluations/<int:evaluation_id>/attributions', methods=['GET'])
def get_attributions_evaluation(evaluation_id):
    try:
        print(f"🔍 Récupération attributions pour évaluation {evaluation_id}")
        attributions = db.get_attributions_evaluation(evaluation_id)
        print(f"✅ {len(attributions)} attributions trouvées")
        

        # Debug: afficher les données
        for attr in attributions:
            print(f"   - ID: {attr['id']}, Classe: {attr['classe']}, User: {attr['utilisateur_id']}, Nom: {attr.get('nom')}, Prénom: {attr.get('prenom')}")
    
        return jsonify([dict(a) for a in attributions])
        
    except Exception as e:
        print(f"❌ Erreur récupération attributions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluations/<int:evaluation_id>/utilisateurs-concernes', methods=['GET'])
def get_utilisateurs_concernes(evaluation_id):
    try:
        print(f"🔍 Backend: Récupération utilisateurs concernés pour évaluation {evaluation_id}")
        utilisateurs = db.get_utilisateurs_concernes_par_evaluation(evaluation_id)
        print(f"✅ Backend: {len(utilisateurs)} utilisateurs concernés trouvés")
        return jsonify([dict(u) for u in utilisateurs])
    except Exception as e:
        print(f"❌ Erreur récupération utilisateurs concernés: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Routes pour la gestion des items d'évaluation
@app.route('/api/ajouter-items-evaluation', methods=['POST'])
def ajouter_items_evaluation():
    data = request.get_json()
    try:
        print(f"🔍 AJOUT ITEMS - Données: {data}")
        
        evaluation_id = data.get('evaluation_id')
        items_ids = data.get('items_ids', [])
        
        if not evaluation_id or not items_ids:
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400
        
        # Utiliser directement la méthode de la Database
        result = db.ajouter_items_evaluation(evaluation_id, items_ids)
        return jsonify(result)
        
    except Exception as e:
        print(f"💥 Erreur ajout items: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/retirer-item-evaluation', methods=['POST'])
def retirer_item_evaluation():
    data = request.get_json()
    try:
        print(f"🔍 RETRAIT ITEM - Données: {data}")
        
        evaluation_id = data.get('evaluation_id')
        item_id = data.get('item_id')
        
        if not evaluation_id or not item_id:
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400
        
        # Utiliser directement la méthode de la Database
        result = db.retirer_item_evaluation(evaluation_id, item_id)
        return jsonify(result)
            
    except Exception as e:
        print(f"💥 Erreur retrait item: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/valider-multiple', methods=['POST'])
def valider_multiple():
    """
    Route pour enregistrer plusieurs validations en une seule fois
    """
    try:
        print("🔵 Début valider-multiple")
        
        # Vérifier que les données JSON sont présentes
        if not request.is_json:
            print("❌ Content-Type n'est pas application/json")
            return jsonify({'success': False, 'error': 'Content-Type must be application/json'}), 400
            
        data = request.get_json()
        print(f"📥 Données JSON reçues: {data}")
        
        # Validation des données requises
        if not data:
            print("❌ Données JSON vides")
            return jsonify({'success': False, 'error': 'Données JSON manquantes'}), 400
        
        utilisateur_id = data.get('utilisateur_id')
        evaluation_id = data.get('evaluation_id')
        validations = data.get('validations', [])
        
        print(f"📊 Extraction - utilisateur_id: {utilisateur_id}, evaluation_id: {evaluation_id}, validations: {len(validations)}")
        
        if not utilisateur_id:
            return jsonify({'success': False, 'error': 'utilisateur_id est requis'}), 400
        
        if not evaluation_id:
            return jsonify({'success': False, 'error': 'evaluation_id est requis'}), 400
        
        if not validations or not isinstance(validations, list):
            return jsonify({'success': False, 'error': 'Liste de validations invalide'}), 400
        
        # Initialiser la base de données
        try:
            db = Database()
            print("✅ Connexion DB réussie")
        except Exception as e:
            print(f"❌ Erreur connexion DB: {str(e)}")
            return jsonify({'success': False, 'error': f'Erreur base de données: {str(e)}'}), 500
        
        # Vérifier que l'utilisateur et l'évaluation existent
        try:
            utilisateur = db.get_utilisateur_par_id(utilisateur_id)
            if not utilisateur:
                print(f"❌ Utilisateur {utilisateur_id} non trouvé")
                return jsonify({'success': False, 'error': f'Utilisateur {utilisateur_id} non trouvé'}), 404
            
            evaluation, _ = db.get_evaluation_detail(evaluation_id)
            if not evaluation:
                print(f"❌ Évaluation {evaluation_id} non trouvée")
                return jsonify({'success': False, 'error': f'Évaluation {evaluation_id} non trouvée'}), 404
                
            print("✅ Utilisateur et évaluation validés")
        except Exception as e:
            print(f"❌ Erreur vérification utilisateur/évaluation: {str(e)}")
            return jsonify({'success': False, 'error': f'Erreur vérification: {str(e)}'}), 500
        
        results = {
            'success': True,
            'message': f'{len(validations)} validation(s) traité(s)',
            'details': {
                'created': 0,
                'updated': 0,
                'errors': []
            }
        }
        
        # Traiter chaque validation
        for i, validation_data in enumerate(validations):
            try:
                item_id = validation_data.get('item_id')
                niveau_validation = validation_data.get('niveau_validation')
                commentaire = validation_data.get('commentaire', '').strip()
                
                print(f"  📋 Traitement item {i+1}: id={item_id}, niveau={niveau_validation}")
                
                # Validation des données de l'item
                if item_id is None:
                    error_msg = f'item_id manquant pour la validation {i+1}'
                    results['details']['errors'].append(error_msg)
                    print(f"    ❌ {error_msg}")
                    continue
                
                if niveau_validation is None:
                    error_msg = f'niveau_validation manquant pour item {item_id}'
                    results['details']['errors'].append(error_msg)
                    print(f"    ❌ {error_msg}")
                    continue
                
                # Vérifier que l'item existe
                try:
                    all_items = db.get_all_items()
                    item_exists = any(item['id'] == item_id for item in all_items)
                    if not item_exists:
                        error_msg = f'Item {item_id} non trouvé'
                        results['details']['errors'].append(error_msg)
                        print(f"    ❌ {error_msg}")
                        continue
                except Exception as e:
                    error_msg = f'Erreur vérification item {item_id}: {str(e)}'
                    results['details']['errors'].append(error_msg)
                    print(f"    ❌ {error_msg}")
                    continue
                
                # Vérifier que le niveau est valide
                if niveau_validation not in [0, 1, 2, 3, 4]:
                    error_msg = f'Niveau invalide {niveau_validation} pour item {item_id}'
                    results['details']['errors'].append(error_msg)
                    print(f"    ❌ {error_msg}")
                    continue
                
                # Vérifier si une validation existe déjà
                try:
                    validations_existantes = db.get_validations_utilisateur(utilisateur_id, evaluation_id)
                    validation_existante = next(
                        (v for v in validations_existantes if v['item_id'] == item_id), 
                        None
                    )
                except Exception as e:
                    error_msg = f'Erreur vérification validation existante: {str(e)}'
                    results['details']['errors'].append(error_msg)
                    print(f"    ❌ {error_msg}")
                    continue
                
                # Utiliser l'email de l'enseignant connecté comme validateur
                validateur = "enseignant@bacpro-ciel.fr"  # À adapter avec votre auth
                
                # Appeler la méthode de mise à jour
                try:
                    validation_result = db.mettre_a_jour_validation(
                        utilisateur_id=utilisateur_id,
                        evaluation_id=evaluation_id,
                        item_id=item_id,
                        niveau=niveau_validation,
                        commentaire=commentaire,
                        validateur=validateur
                    )
                    
                    if validation_result:
                        if validation_existante:
                            results['details']['updated'] += 1
                            print(f"    ✅ Mise à jour - Item {item_id}, Niveau {niveau_validation}")
                        else:
                            results['details']['created'] += 1
                            print(f"    ✅ Création - Item {item_id}, Niveau {niveau_validation}")
                    else:
                        error_msg = f"Échec opération base de données pour item {item_id}"
                        results['details']['errors'].append(error_msg)
                        print(f"    ❌ {error_msg}")
                        
                except Exception as e:
                    error_msg = f"Erreur DB item {item_id}: {str(e)}"
                    results['details']['errors'].append(error_msg)
                    print(f"    ❌ {error_msg}")
                    continue
                
            except Exception as e:
                error_msg = f"Erreur générale item {item_id}: {str(e)}"
                results['details']['errors'].append(error_msg)
                print(f"    ❌ {error_msg}")
                import traceback
                print(traceback.format_exc())
                continue
        
        # Log de synthèse
        print(f"🎯 Validations terminées - Créées: {results['details']['created']}, Mises à jour: {results['details']['updated']}, Erreurs: {len(results['details']['errors'])}")
        
        # Retourner la réponse
        response = jsonify(results)
        print(f"📤 Envoi réponse: {results}")
        return response
        
    except Exception as e:
        error_msg = f"Erreur globale: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        print(traceback.format_exc())
        
        # Retourner une erreur JSON valide
        return jsonify({
            'success': False, 
            'error': error_msg
        }), 500

if __name__ == '__main__':
    print("🚀 Démarrage de l'API Bac Pro CIEL - Backend corrigé")
    app.run(host='0.0.0.0', port=5000, debug=True)