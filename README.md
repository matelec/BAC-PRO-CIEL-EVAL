# BAC-PRO-CIEL-EVAL
application d'évaluations des compétences 

calcul des 

📊 Système de Notation

Échelle de Validation

Niveau 0 : Non validé
Niveau 1 : Partiellement validé
Niveau 2 : Moyennement validé
Niveau 3 : Bien validé
Niveau 4 : Très bien validé

1. Total des Points (total_niveaux): 
Calcul : Somme de tous les niveaux de validation pour cette compétence

Exemple :

Validation 1 : Niveau 3
Validation 2 : Niveau 2
Validation 3 : Niveau 4
Total = 3 + 2 + 4 = 9 points

2. Nombre de Validations (nb_validations)
Calcul : Compte le nombre de fois où la compétence a été évaluée

Exemple : 3 validations = 3 évaluations

3. Niveau Moyen (niveau_moyen)
Calcul : total_niveaux ÷ nb_validations

Exemple : 9 ÷ 3 = 3.0 de moyenne

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