from flask import Flask, render_template, request, jsonify, redirect, url_for
import requests
import os

app = Flask(__name__)
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:5000')

def get_backend_data(endpoint):
    try:
        response = requests.get(f"{BACKEND_URL}{endpoint}")
        return response.json() if response.status_code == 200 else []
    except:
        return []

@app.route('/')
def index():
    return render_template('index.html')

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
        'module': request.form['module'],
        'contexte': request.form['contexte'],
        'items_ids': [int(id) for id in request.form.getlist('items_ids')]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/evaluations", json=data)
        if response.status_code == 201:
            return redirect(url_for('evaluations'))
    except:
        pass
    
    return redirect(url_for('evaluations'))

@app.route('/evaluation/<int:evaluation_id>')
def detail_evaluation(evaluation_id):
    evaluation_data = get_backend_data(f'/api/evaluations/{evaluation_id}')
    validations = get_backend_data(f'/api/evaluations/{evaluation_id}/validations')
    utilisateurs = get_backend_data('/api/utilisateurs')
    
    return render_template('detail_evaluation.html',
                         evaluation=evaluation_data.get('evaluation', {}),
                         items=evaluation_data.get('items', []),
                         validations=validations,
                         utilisateurs=utilisateurs)

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

    try:
        response = requests.put(f"{BACKEND_URL}/api/utilisateurs/{user_id}", json=data)
        if response.status_code == 201:
            return jsonify({'id': response.json().get('id')})
        else:
            return jsonify({'error': 'Backend error'}), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)