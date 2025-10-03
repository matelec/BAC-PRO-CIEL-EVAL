## BAC-PRO-CIEL-EVAL

Application d'évaluations des compétences en BAC PRO CIEL

## Description

Application web permettant d'effectuer la validation et le suivi des compétences du BAC PRO CIEL. Elle permet d'éditer les 3 notes d'épreuves E2, E31 et E32 en fin d'année de certification.

## Déploiement

L'application se déploie sur un serveur linux avec l'environnement docker.

### Conseil d'installation

VPS sur serveur proxmox: 2 core, 4Go RAM et 32Go de HDD.  
Installer debian 13 en mode serveur (sans graphique) et ssh port 22 actif.

## Procédure d'installation

1. Se connecter à distance au VPS

2. Télécharger le dépôt :
    ```bash
   wget https://github.com/matelec/BAC-PRO-CIEL-EVAL

2. se connecter en root:
    ```bash
    su -

4. se placer dans le répertoire /BAC-PRO-CIEL-EVAL/
    ```bash
    cd /BAC-PRO-CIEL-EVAL

5. Installer l'environnement docker:

    ```bash
    chmod +x script-installation-docker.sh
    ./script-installation-docker.sh

    usermod -aG docker "votre utilisateur"



    ## Informations

    ### Calcul des status des compétences

    ## 📊 Système de Notation

    ### Échelle de Validation

    - **Niveau 0** : Non validé
    - **Niveau 1** : Partiellement validé  
    - **Niveau 2** : Moyennement validé
    - **Niveau 3** : Bien validé
    - **Niveau 4** : Très bien validé

    ### 1. Total des Points (`total_niveaux`)

    **Calcul** : Somme de tous les niveaux de validation pour cette compétence

    **Exemple** :
    ```bash
    Validation 1 : Niveau 3
    Validation 2 : Niveau 2  
    Validation 3 : Niveau 4
    Total = 3 + 2 + 4 = 9 points

    ### 2. Nombre de Validations (nb_validations)

    **Calcul** : Compte le nombre de fois où la compétence a été évaluée

    **Exemple** : 3 validations = 3 évaluations

    ### 3. Niveau Moyen (niveau_moyen)

    **Calcul** : total_niveaux ÷ nb_validations

    **Exemple** : 9 ÷ 3 = 3.0 de moyenne

🎯 Système de Statuts
Conditions pour chaque statut :
        if nb_validations == 0:
            statut = "Non évalué"
        elif total >= 12 and niveau_moyen >= 3:
            statut = "Maîtrisé"        # ✅ Bon niveau avec suffisamment d'évaluations
        elif total >= 8 and niveau_moyen >= 2:
            statut = "En cours"        # 🔄 Niveau correct mais peut progresser
        else:
            statut = "À travailler"    # ❌ Niveau insuffisant ou peu évalué

💡 Logique Pédagogique:
"Maîtrisé" : L'élève démontre une compréhension solide et constante
"En cours" : L'élève progresse mais n'a pas encore atteint l'excellence
"À travailler" : L'élève a des difficultés ou n'a pas assez pratiqué
"Non évalué" : La compétence n'a pas encore été évaluée            

# BAC-PRO-CIEL-EVAL

Application d'évaluations des compétences en BAC PRO CIEL

## Description

Application web permettant d'effectuer la validation et le suivi des compétences du BAC PRO CIEL. Elle permet d'éditer les 3 notes d'épreuves E2, E31 et E32 en fin d'année de certification.

## Déploiement

L'application se déploie sur un serveur linux avec l'environnement docker.

### Conseil d'installation

VPS sur serveur proxmox: 2 core, 4Go RAM et 32Go de HDD.  
Installer debian 13 en mode serveur (sans graphique) et ssh port 22 actif.

## Procédure d'installation

1. Se connecter à distance au VPS

2. Télécharger le dépôt :
   ```bash
   wget https://github.com/matelec/BAC-PRO-CIEL-EVAL
