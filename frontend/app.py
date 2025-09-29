from flask import Flask, render_template, request, jsonify, redirect, url_for
import requests
from datetime import datetime
import os, sys

app = Flask(__name__)
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:5000')

# === FILTRE JINJA2 POUR LE FORMATAGE DES DATES ===
@app.template_filter('datetimeformat')
def datetimeformat(value, format='%d/%m/%Y'):
    """
    Filtre Jinja2 pour formater les dates dans les templates
    """
    if value is None:
        return "Non définie"
    
    # Si c'est déjà un objet datetime
    if isinstance(value, datetime):
        return value.strftime(format)
    
    # Si c'est une string, essayer de la parser
    try:
        # Essayer différents formats de date
        for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%d/%m/%Y', '%d/%m/%Y %H:%M:%S']:
            try:
                if isinstance(value, str):
                    date_obj = datetime.strptime(value, fmt)
                    return date_obj.strftime(format)
            except ValueError:
                continue
    except Exception as e:
        print(f"Erreur formatage date: {e}")
    
    # Si on ne peut pas parser, retourner la valeur originale
    return str(value) if value else "Non définie"

def get_backend_data(endpoint):
    try:
        response = requests.get(f"{BACKEND_URL}{endpoint}")
        return response.json() if response.status_code == 200 else []
    except:
        return []

@app.route('/')
def index():
    utilisateurs = get_backend_data('/api/utilisateurs')
    evaluations_data = get_backend_data('/api/evaluations')
    return render_template('index.html', 
                        utilisateurs=utilisateurs,
                        evaluations=evaluations_data)

@app.route('/utilisateurs')
def utilisateurs():
    utilisateurs = get_backend_data('/api/utilisateurs')
    return render_template('utilisateurs.html', utilisateurs=utilisateurs)

@app.route('/evaluations')
def evaluations():
    evaluations_data = get_backend_data('/api/evaluations')
    competences = get_backend_data('/api/competences')
    items = get_backend_data('/api/items')
    return render_template('evaluations.html', 
                         evaluations=evaluations_data,
                         competences=competences,
                         items=items)

@app.route('/creer-evaluation', methods=['POST'])
def creer_evaluation():
    data = {
        'pole': request.form['pole'],
        'module': request.form['module'],
        'contexte': request.form['contexte'],
        'items_ids': [int(id) for id in request.form.getlist('items_ids')]
    }
    
    print(f"🔍 Création évaluation - Données: {data}", flush=True)  # Debug

    try:
        response = requests.post(f"{BACKEND_URL}/api/evaluations", json=data)
        if response.status_code == 201:
            return redirect(url_for('evaluations'))
    except:
        pass
    
    return redirect(url_for('evaluations'))

@app.route('/evaluation/<int:evaluation_id>')
def detail_evaluation(evaluation_id):
    print(f"🔍 DETAIL EVALUATION - ID: {evaluation_id}")
    
    evaluation_data = get_backend_data(f'/api/evaluations/{evaluation_id}')
    
    # Récupérer les attributions
    attributions = get_backend_data(f'/api/evaluations/{evaluation_id}/attributions')
    print(f"🔍 Attributions récupérées: {len(attributions)}")
    
    # Récupérer les utilisateurs CONCERNÉS par cette évaluation
    utilisateurs_concernes = get_backend_data(f'/api/evaluations/{evaluation_id}/utilisateurs-concernes')
    print(f"🔍 Utilisateurs concernés: {len(utilisateurs_concernes)}")
    
    # Récupérer tous les utilisateurs (pour le formulaire d'attribution)
    tous_utilisateurs = get_backend_data('/api/utilisateurs')
    
    validations = get_backend_data(f'/api/evaluations/{evaluation_id}/validations')
    
    # Récupérer tous les items disponibles
    tous_items = get_backend_data('/api/items')
    
    # Récupérer les compétences depuis le backend
    competences = get_backend_data('/api/competences')
    print(f"🔍 Compétences récupérées: {len(competences)}")

    return render_template('detail_evaluation.html',
                         evaluation=evaluation_data.get('evaluation', {}),
                         items=evaluation_data.get('items', []),
                         attributions=attributions,
                         utilisateurs=utilisateurs_concernes,  # ← Seulement les concernés
                         tous_utilisateurs=tous_utilisateurs,  # ← Tous pour le formulaire
                         tous_items=tous_items,
                         validations=validations,
                         competences=competences)

@app.route('/api/evaluations/<int:evaluation_id>/utilisateurs-concernes')
def get_utilisateurs_concernes(evaluation_id):
    try:
        response = requests.get(f"{BACKEND_URL}/api/evaluations/{evaluation_id}/utilisateurs-concernes")
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/valider/<int:evaluation_id>/<int:utilisateur_id>')
def page_validation(evaluation_id, utilisateur_id):
    evaluation_data = get_backend_data(f'/api/evaluations/{evaluation_id}')
    utilisateur = next((u for u in get_backend_data('/api/utilisateurs') if u['id'] == utilisateur_id), {})
    validations = get_backend_data(f'/api/utilisateurs/{utilisateur_id}/validations?evaluation_id={evaluation_id}')
    
    return render_template('validation.html',
                         evaluation=evaluation_data.get('evaluation', {}),
                         items=evaluation_data.get('items', []),
                         utilisateur=utilisateur,
                         validations=validations)

@app.route('/api/valider-multiple', methods=['POST'])
def valider_multiples():
    data = request.get_json()
    try:
        response = requests.post(f"{BACKEND_URL}/api/valider-multiple", json=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/valider-item', methods=['POST'])
def valider_item():
    data = {
        'utilisateur_id': int(request.form['utilisateur_id']),
        'evaluation_id': int(request.form['evaluation_id']),
        'item_id': int(request.form['item_id']),
        'niveau_validation': int(request.form['niveau_validation']),
        'commentaire': request.form.get('commentaire', ''),
        'validateur': request.form.get('validateur', 'Enseignant')
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/validations", json=data)
        if response.status_code == 200:
            return redirect(url_for('page_validation', 
                                  evaluation_id=data['evaluation_id'],
                                  utilisateur_id=data['utilisateur_id']))
    except:
        pass
    
    return redirect(url_for('evaluations'))

@app.route('/ajouter-utilisateur', methods=['POST'])
def ajouter_utilisateur():
    # Si le frontend envoie du JSON
    if request.is_json:
        data = request.get_json()
    else:
        # Sinon, lecture des données formulaire
        data = {
            'nom': request.form.get('nom'),
            'prenom': request.form.get('prenom'),
            'email': request.form.get('email'),
            'date_naissance': request.form.get('date_naissance'),
            'classe': request.form.get('classe'),
            'date_entree_bac': request.form.get('date_entree_bac'),
            'date_certification': request.form.get('date_certification'),
            'specialite': request.form.get('specialite', '')
        }

    try:
        response = requests.post(f"{BACKEND_URL}/api/utilisateurs", json=data)
        if response.status_code == 201:
            return jsonify({'id': response.json().get('id')})
        else:
            return jsonify({'error': 'Backend error'}), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/modifier_utilisateur', methods=['POST'])
def modifier_utilisateur_route():
    try:
        # Récupérer user_id depuis le formulaire
        user_id = request.form.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': 'ID utilisateur manquant'}), 400
        
        user_id = int(user_id)

        data={
            'nom': request.form.get('nom'),
            'prenom': request.form.get('prenom'),
            'email': request.form.get('email'),
            'date_naissance': request.form.get('date_naissance'),
            'classe': request.form.get('classe'),
            'date_entree_bac': request.form.get('date_entree_bac'),
            'date_certification': request.form.get('date_certification'),
            'specialite': request.form.get('specialite', '')
        }

        response = requests.put(f"{BACKEND_URL}/api/utilisateurs/{user_id}", json=data)
        if response.status_code == 200:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Backend error'}), response.status_code
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/supprimer_utilisateur', methods=['POST'])
def supprimer_utilisateur_route():
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        print(f"🔍 Tentative de suppression de l'utilisateur ID: {user_id}")  # Debug
        

        if not user_id:
            return jsonify({'error': 'ID utilisateur manquant'}), 400

        # Envoi de la requête DELETE vers le backend
        response = requests.delete(f"{BACKEND_URL}/api/utilisateurs/{user_id}")

        if response.status_code == 200:
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Erreur backend'}), response.status_code

    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/import-utilisateurs', methods=['POST'])
def import_utilisateurs():
    print("🔍 Frontend: Réception demande d'import")

    if 'file' not in request.files:
        print("❌ Frontend: Aucun fichier dans la requête")
        return jsonify({'success': False, 'error': 'Aucun fichier reçu'}), 400

    file = request.files['file']
    print(f"📁 Frontend: Fichier reçu - {file.filename}, type: {file.content_type}")

    try:
        # Envoyer au backend avec le bon format
        files = {
            'file': (file.filename, file.stream, file.content_type)
        }
        
        print(f"📤 Frontend: Envoi vers backend - {BACKEND_URL}/api/utilisateurs/import-excel")
        
        response = requests.post(
            f"{BACKEND_URL}/api/utilisateurs/import-excel",
            files=files,
            timeout=30  # Timeout de 30 secondes
        )
        
        print(f"📥 Frontend: Réponse backend - Status: {response.status_code}")
        print(f"📥 Frontend: Contenu réponse: {response.text[:500]}...")

        # Répercuter la réponse du backend vers le frontend
        if response.status_code == 200:
            result = response.json()
            return jsonify(result)
        else:
            try:
                error_data = response.json()
                return jsonify(error_data), response.status_code
            except:
                return jsonify({
                    'success': False,
                    'error': f'Erreur backend (HTTP {response.status_code})',
                    'response_text': response.text
                }), response.status_code
                
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'Timeout lors de la communication avec le backend'
        }), 500
    except requests.exceptions.ConnectionError:
        return jsonify({
            'success': False,
            'error': 'Impossible de se connecter au backend'
        }), 500
    except Exception as e:
        print(f"❌ Frontend: Erreur inattendue: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/referentiel')
def referentiel():
    competences = get_backend_data('/api/competences')
    items = get_backend_data('/api/items')
    
    # Calculer le total des items
    total_items = len(items)
    
    return render_template('referentiel.html',
                         competences=competences,
                         items=items,
                         total_items=total_items)

# Routes proxy pour les attributions
@app.route('/api/attribuer-evaluation', methods=['POST'])
def proxy_attribuer_evaluation():
    data = request.get_json()
    try:
        response = requests.post(f"{BACKEND_URL}/api/attribuer-evaluation", json=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
        
@app.route('/api/retirer-attribution', methods=['POST'])
def retirer_attribution():
    data = request.get_json()
    try:
        response = requests.post(f"{BACKEND_URL}/api/retirer-attribution", json=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/modifier-evaluation', methods=['POST'])
def modifier_evaluation():
    data = request.get_json()
    try:
        response = requests.post(f"{BACKEND_URL}/api/modifier-evaluation", json=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/supprimer-evaluation', methods=['POST'])
def supprimer_evaluation():
    data = request.get_json()
    try:
        response = requests.post(f"{BACKEND_URL}/api/supprimer-evaluation", json=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/evaluations/<int:evaluation_id>/attributions')
def get_attributions_evaluation(evaluation_id):
    try:
        response = requests.get(f"{BACKEND_URL}/api/evaluations/{evaluation_id}/attributions")
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ajouter-items-evaluation', methods=['POST'])
def ajouter_items_evaluation():
    data = request.get_json()
    try:
        response = requests.post(f"{BACKEND_URL}/api/ajouter-items-evaluation", json=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/retirer-item-evaluation', methods=['POST'])
def retirer_item_evaluation():
    data = request.get_json()
    try:
        response = requests.post(f"{BACKEND_URL}/api/retirer-item-evaluation", json=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

        
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)