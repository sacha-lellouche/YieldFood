# ✨ Suggestion Automatique d'Ingrédients - Mode d'emploi

## 🎯 Nouvelle fonctionnalité

Les ingrédients sont maintenant **suggérés automatiquement** pendant que vous tapez le nom de votre recette !

---

## 🚀 Comment ça fonctionne ?

### 1️⃣ Tapez le nom de la recette

Commencez à taper dans le champ "Nom de la recette" :
- **Minimum 3 caractères** requis
- Exemples : "Pâtes carbonara", "Pizza margherita", "Poulet rôti"

### 2️⃣ Attendez 1 seconde

Le système attend que vous ayez **fini de taper** (délai de 1 seconde).

Vous verrez ce message :
```
✨ Les ingrédients seront suggérés automatiquement...
```

### 3️⃣ Les ingrédients apparaissent automatiquement

Après 1 seconde sans modification, l'IA suggère automatiquement les ingrédients :
- Liste complète d'ingrédients
- Quantités suggérées
- Unités appropriées

Vous verrez :
```
🔄 Suggestion en cours...
```

Puis :
```
✓ Ingrédients suggérés automatiquement
```

---

## 🎨 Interface

### Indicateurs visuels

1. **Pendant la frappe** (≥ 3 caractères) :
   - 💡 Message : "Les ingrédients seront suggérés automatiquement..."

2. **Pendant la suggestion** :
   - 🔄 Icône animée : "Suggestion en cours..."

3. **Après suggestion réussie** :
   - ✓ Message vert : "Ingrédients suggérés automatiquement"

### Bouton manuel

Si vous voulez forcer une nouvelle suggestion, cliquez sur :
```
✨ Suggérer avec IA
```

---

## ⚙️ Comportement intelligent

### Auto-suggestion activée seulement si :
- ✅ Nom de recette ≥ 3 caractères
- ✅ Liste d'ingrédients vide (ou 1 ligne vide)
- ✅ Première fois (pas déjà suggéré)

### Désactivation automatique :
- Après la première suggestion automatique réussie
- Pour éviter d'écraser vos modifications
- Vous pouvez toujours re-suggérer avec le bouton manuel

---

## 📝 Exemples de recettes testées

### Suggestions intelligentes intégrées :

**"carbonara"** → Pâtes, bacon, œufs, parmesan, poivre
**"pizza"** → Farine, sauce tomate, mozzarella, huile d'olive
**"omelette"** → Œufs, beurre, sel, poivre
**"poulet rôti"** → Poulet, oignon, ail, huile d'olive, herbes
**"gâteau"** → Farine, sucre, œufs, beurre, levure
**"salade caesar"** → Laitue, poulet, parmesan, croûtons, sauce caesar
**"pâtes"** → Pâtes, ail, huile d'olive, parmesan

### Avec OpenAI (si API key configurée) :
Toutes les recettes sont supportées avec des suggestions personnalisées !

---

## 🔧 Configuration

### Mode par défaut (Mock) :
Fonctionne immédiatement, pas de configuration nécessaire.

### Mode OpenAI (optionnel) :
Ajoutez dans `.env.local` :
```bash
OPENAI_API_KEY=sk-proj-...votre-clé...
```

Redémarrez le serveur :
```bash
npm run dev
```

---

## 💡 Conseils d'utilisation

### Pour de meilleures suggestions :
1. **Soyez spécifique** : "Pizza margherita" plutôt que "Pizza"
2. **Utilisez des noms courants** : "Pâtes carbonara" plutôt que "Carbo"
3. **En français** : Le système comprend mieux le français

### Modification après suggestion :
- ✏️ **Modifiez librement** les quantités
- ➕ **Ajoutez** des ingrédients avec le bouton "+"
- 🗑️ **Supprimez** des lignes indésirables
- 🔄 **Re-suggérez** avec le bouton si besoin

---

## 🎬 Workflow complet

1. **Tapez** : "Pâtes carbonara"
2. **Attendez** : 1 seconde (✨ message)
3. **Suggestion automatique** : 5-8 ingrédients apparaissent
4. **Ajustez** : Modifiez les quantités selon vos portions
5. **Complétez** : Ajoutez temps de préparation, cuisson, portions
6. **Sauvegardez** : Cliquez sur "Enregistrer la recette"

---

## 🐛 Dépannage

### Les suggestions ne se déclenchent pas ?
- ✅ Vérifiez que vous avez tapé au moins 3 caractères
- ✅ Attendez 1 seconde complète sans modifier
- ✅ La liste d'ingrédients doit être vide au départ

### Les suggestions sont vides ?
- 🔍 Le système n'a pas reconnu la recette
- 💡 Essayez un nom plus courant ou cliquez sur le bouton manuel
- 🤖 Ajoutez une clé OpenAI pour des suggestions illimitées

### Je veux désactiver l'auto-suggestion ?
- ✍️ Remplissez manuellement le premier ingrédient
- 🔄 L'auto-suggestion ne se déclenchera plus pour cette recette

---

## 🚀 Prochaines améliorations possibles

- [ ] Suggestions basées sur les ingrédients en stock
- [ ] Apprentissage de vos recettes préférées
- [ ] Suggestions de variations (ex: carbonara végétarienne)
- [ ] Calcul automatique des coûts
- [ ] Export PDF de recettes

---

## 📞 Questions ?

Cette fonctionnalité utilise l'API OpenAI (optionnel) ou un système de patterns intelligent (par défaut).

Aucune donnée n'est partagée avec des tiers. Les suggestions sont générées en temps réel.

Bon appétit ! 👨‍🍳
