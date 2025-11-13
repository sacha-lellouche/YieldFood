# 🔧 Guide de Dépannage - UX/CSS YieldFood

## 🚨 Problème : "Je ne vois plus aucune UX sur mon site"

### Solutions rapides

#### 1️⃣ Vérifier le bon port

Le serveur tourne sur : **http://localhost:3000**

Essayez d'abord cette URL dans votre navigateur.

---

#### 2️⃣ Nettoyer le cache et redémarrer

```bash
# Tuer tous les processus Node.js
killall -9 node

# Nettoyer le cache Next.js
rm -rf .next

# Redémarrer
npm run dev
```

Puis accédez à : **http://localhost:3000**

---

#### 3️⃣ Vérifier le CSS Tailwind

Si vous voyez du texte mais **sans styles** (tout en noir/blanc), le problème est que Tailwind ne se charge pas.

**Solution :**

```bash
# Réinstaller les dépendances CSS
npm install tailwindcss postcss autoprefixer --save-dev --legacy-peer-deps

# Redémarrer
npm run dev
```

---

#### 4️⃣ Forcer le rechargement du navigateur

Dans votre navigateur :
- **Chrome/Edge** : `Cmd + Shift + R` (Mac) ou `Ctrl + Shift + R` (Windows)
- **Safari** : `Cmd + Option + R`
- **Firefox** : `Cmd + Shift + R`

Ou :
- Ouvrir les DevTools (`F12` ou `Cmd + Option + I`)
- Faire un clic droit sur le bouton de rechargement
- Choisir "Vider le cache et effectuer une actualisation forcée"

---

#### 5️⃣ Vérifier la console du navigateur

1. Ouvrir les **DevTools** (`F12`)
2. Aller dans l'onglet **Console**
3. Chercher des erreurs en rouge

Erreurs courantes :
- `Failed to load resource` → Problème de chemin
- `Uncaught TypeError` → Problème JavaScript
- `ERR_CONNECTION_REFUSED` → Le serveur ne tourne pas

---

#### 6️⃣ Vérifier le fichier .env.local

Assurez-vous que votre fichier `.env.local` contient bien :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

Sans ces variables, l'authentification ne fonctionne pas.

---

#### 7️⃣ Réinstaller les node_modules

Si rien ne fonctionne :

```bash
# Supprimer les modules
rm -rf node_modules package-lock.json

# Réinstaller
npm install --legacy-peer-deps

# Redémarrer
npm run dev
```

---

## 🔍 Diagnostic

### Le serveur ne démarre pas ?

```bash
# Vérifier si un processus occupe le port
lsof -ti:3000

# Si oui, le tuer
lsof -ti:3000 | xargs kill -9

# Redémarrer
npm run dev
```

### Page blanche ?

1. Vérifier la console du navigateur (F12)
2. Vérifier les logs du terminal
3. Vérifier que `.env.local` existe et est correct

### CSS ne se charge pas ?

**Symptômes :** Texte visible mais sans couleurs, sans mise en page

**Cause :** Tailwind CSS ne compile pas

**Solution :**

```bash
# Vérifier que tailwindcss est installé
npm list tailwindcss

# Si absent, installer
npm install tailwindcss --save-dev --legacy-peer-deps

# Nettoyer et redémarrer
rm -rf .next
npm run dev
```

---

## 📊 Vérifications système

### 1. Node.js version
```bash
node --version  # Doit être >= 18
```

### 2. npm version
```bash
npm --version  # Doit être >= 9
```

### 3. Dépendances installées
```bash
npm list next react react-dom tailwindcss
```

### 4. Port disponible
```bash
lsof -i:3000  # Ne doit rien retourner si disponible
```

---

## 🌐 Tester dans différents navigateurs

Si le problème persiste dans Chrome, essayez :
- Firefox
- Safari
- Edge

Parfois, un problème de cache navigateur peut causer des soucis.

---

## 🆘 Derniers recours

### Reset complet

```bash
# Tuer tous les processus
killall -9 node

# Nettoyer tout
rm -rf node_modules .next package-lock.json

# Réinstaller
npm install --legacy-peer-deps

# Redémarrer
npm run dev
```

### Vérifier que l'application compile

```bash
# Essayer de build (au lieu de dev)
npm run build

# Si ça échoue, il y a des erreurs TypeScript
# Les corriger d'abord
```

---

## ✅ Checklist de vérification

Avant de demander de l'aide, vérifier :

- [ ] Le serveur tourne (message "Ready in XXms" dans le terminal)
- [ ] L'URL est correcte (http://localhost:3000)
- [ ] Le fichier `.env.local` existe
- [ ] Les `node_modules` sont installés
- [ ] Le cache navigateur est vidé
- [ ] La console du navigateur ne montre pas d'erreurs
- [ ] Les logs du terminal ne montrent pas d'erreurs critiques

---

## 📞 Commandes de diagnostic utiles

```bash
# Voir les processus Node.js en cours
ps aux | grep node

# Voir les ports utilisés
lsof -i -P | grep LISTEN | grep node

# Tester si l'API répond
curl http://localhost:3000

# Voir les logs en temps réel
npm run dev  # (sans & à la fin)
```

---

## 🎯 État actuel de votre serveur

Votre serveur devrait tourner sur : **http://localhost:3000**

Pages disponibles :
- `/` - Page d'accueil
- `/login` - Connexion
- `/signup` - Inscription  
- `/dashboard` - Dashboard (authentification requise)
- `/stocks` - Gestion des stocks (authentification requise)
- `/recipes` - Gestion des recettes (authentification requise)

Si vous voyez la page mais sans styles, redémarrez avec :
```bash
rm -rf .next && npm run dev
```

Bonne chance ! 🚀
