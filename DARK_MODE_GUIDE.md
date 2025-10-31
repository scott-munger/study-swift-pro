# 🌓 Guide du Mode Sombre - Tyala Platform

## ✅ Implémentation Complète

### 1. 🎨 **Système de Thème**

#### **ThemeContext** (`src/contexts/ThemeContext.tsx`)
- Gestion globale du thème (light/dark)
- Détection automatique de la préférence système
- Sauvegarde dans localStorage
- Synchronisation avec la BDD

#### **ThemeToggle** (`src/components/ui/ThemeToggle.tsx`)
- Bouton toggle avec icônes Soleil/Lune
- Animation fluide de transition
- Tooltip informatif
- Intégré dans la Navbar

---

### 2. 🎨 **Variables CSS** (`src/index.css`)

Toutes les variables CSS ont été définies pour les deux modes :

#### **Mode Clair**
```css
:root {
  --background: 0 0% 100%; /* Blanc */
  --foreground: 222 84% 4.9%; /* Noir bleuté */
  --primary: 200 100% 50%; /* #00aaff - Tyala Blue */
  --secondary: 75 100% 50%; /* #80ff00 - Lime Green */
  /* ... */
}
```

#### **Mode Sombre**
```css
.dark {
  --background: 220 26% 14%; /* #1a2332 - Dark blue-gray */
  --foreground: 210 40% 98%; /* #f7fafc - Almost white */
  --primary: 200 100% 50%; /* #00aaff - Tyala Blue (vibrant) */
  --secondary: 75 100% 50%; /* #80ff00 - Lime Green (vibrant) */
  /* ... */
}
```

**Couleurs Tyala conservées :**
- ✅ Bleu Tyala (`#00aaff`) - Identique dans les deux modes
- ✅ Vert Lime (`#80ff00`) - Identique dans les deux modes
- ✅ Gradients ajustés pour chaque mode

---

### 3. 🔧 **Configuration**

#### **Tailwind CSS** (`tailwind.config.ts`)
```typescript
export default {
  darkMode: ["class"], // ✅ Déjà configuré
  // ...
}
```

#### **App.tsx**
```tsx
<ThemeProvider>
  <AuthProvider>
    {/* ... reste de l'app ... */}
  </AuthProvider>
</ThemeProvider>
```

---

### 4. 📝 **Guide d'Utilisation pour les Composants**

#### **Utiliser les variables CSS (RECOMMANDÉ)**
```tsx
// ✅ BON - S'adapte automatiquement
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    <h1 className="text-primary">Titre</h1>
  </Card>
</div>
```

#### **Classes conditionnelles Tailwind**
```tsx
// ✅ BON - Pour les cas spécifiques
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">Texte</p>
</div>
```

#### **Classes à éviter**
```tsx
// ❌ ÉVITER - Ne s'adapte pas au mode sombre
<div className="bg-white text-black">
  <p className="text-gray-900">Texte</p>
</div>

// ✅ CORRIGER EN
<div className="bg-background text-foreground">
  <p className="text-foreground">Texte</p>
</div>
```

---

### 5. 🔄 **Classes Tailwind avec Support Mode Sombre**

#### **Backgrounds**
| ❌ À éviter | ✅ À utiliser |
|------------|--------------|
| `bg-white` | `bg-background` ou `bg-white dark:bg-gray-900` |
| `bg-gray-50` | `bg-muted` ou `bg-gray-50 dark:bg-gray-800` |
| `bg-gray-100` | `bg-accent` ou `bg-gray-100 dark:bg-gray-800` |

#### **Texte**
| ❌ À éviter | ✅ À utiliser |
|------------|--------------|
| `text-black` | `text-foreground` ou `text-black dark:text-white` |
| `text-gray-900` | `text-foreground` ou `text-gray-900 dark:text-gray-100` |
| `text-gray-600` | `text-muted-foreground` ou `text-gray-600 dark:text-gray-400` |

#### **Bordures**
| ❌ À éviter | ✅ À utiliser |
|------------|--------------|
| `border-gray-200` | `border-border` ou `border-gray-200 dark:border-gray-700` |
| `border-gray-300` | `border-border` ou `border-gray-300 dark:border-gray-600` |

#### **Ombres**
```tsx
// ✅ Les ombres s'adaptent automatiquement
<div className="shadow-soft">Card</div>
<div className="shadow-primary">Card</div>
<div className="shadow-lg dark:shadow-2xl">Card</div>
```

---

### 6. 🎯 **Pattern de Composant Typique**

```tsx
import { useTheme } from '@/contexts/ThemeContext';

export function MyComponent() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec gradient adaptatif */}
      <header className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-900">
        <h1 className="text-white">Titre</h1>
      </header>

      {/* Card avec variables CSS */}
      <div className="bg-card text-card-foreground rounded-lg shadow-soft p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Sous-titre
        </h2>
        
        {/* Bouton primaire */}
        <button className="bg-primary text-primary-foreground hover:opacity-90">
          Action
        </button>

        {/* Texte muted */}
        <p className="text-muted-foreground mt-4">
          Description secondaire
        </p>
      </div>

      {/* Section avec classe conditionnelle */}
      <div className="mt-8 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Contenu avec style spécifique
        </p>
      </div>
    </div>
  );
}
```

---

### 7. 📦 **Composants UI Shadcn**

Les composants Shadcn utilisent déjà les variables CSS et fonctionnent automatiquement :

✅ **Fonctionnent sans modification :**
- `Button`
- `Card`
- `Dialog`
- `Select`
- `Input`
- `Textarea`
- `Dropdown`
- `Tooltip`
- `Avatar`
- `Badge`
- Tous les autres composants Shadcn

---

### 8. 🔌 **API Backend**

#### **Endpoint de sauvegarde du thème**
```typescript
PUT /api/profile/theme
Authorization: Bearer <token>
Body: { "darkMode": true }

Response:
{
  "message": "Mode sombre activé",
  "darkMode": true
}
```

#### **Utilisation dans le frontend**
Le `ThemeContext` sauvegarde automatiquement la préférence :
```typescript
// Automatique lors du toggle
toggleTheme(); // Sauvegarde en BDD + localStorage

// Ou manuel
setTheme('dark'); // Sauvegarde en BDD + localStorage
```

---

### 9. 🎨 **Palette de Couleurs Tyala**

#### **Mode Clair**
```
Background: #FFFFFF (Blanc)
Foreground: #0A0F1E (Noir bleuté)
Primary: #00AAFF (Bleu Tyala)
Secondary: #80FF00 (Vert Lime)
Accent: #F0FAFF (Bleu très clair)
```

#### **Mode Sombre**
```
Background: #1A2332 (Bleu-gris foncé)
Foreground: #F7FAFC (Blanc cassé)
Primary: #00AAFF (Bleu Tyala - identique)
Secondary: #80FF00 (Vert Lime - identique)
Accent: #0099DD (Bleu légèrement plus sombre)
Card: #232D3F (Bleu-gris moyen)
```

---

### 10. ✅ **Checklist pour Adapter un Composant**

- [ ] Remplacer `bg-white` par `bg-background` ou `bg-white dark:bg-gray-900`
- [ ] Remplacer `text-black` / `text-gray-900` par `text-foreground`
- [ ] Remplacer `text-gray-600` par `text-muted-foreground`
- [ ] Remplacer `border-gray-200/300` par `border-border`
- [ ] Vérifier les gradients et ajouter variantes dark si nécessaire
- [ ] Tester visuellement en mode clair ET sombre
- [ ] Vérifier le contraste (accessibilité)

---

### 11. 🧪 **Test**

#### **Manuel**
1. Ouvrir l'application
2. Cliquer sur l'icône Soleil/Lune dans la Navbar
3. Vérifier que tous les éléments s'adaptent
4. Rafraîchir la page → Le thème doit persister
5. Déconnexion/Connexion → Le thème doit être restauré

#### **Automatique (préférence système)**
1. Changer la préférence système (macOS/Windows)
2. Si aucun thème n'est sauvegardé, l'app doit suivre le système

---

### 12. 📊 **Composants Déjà Adaptés**

✅ **Navbar** - Toggle de thème intégré
✅ **ThemeToggle** - Composant de toggle
✅ **NotificationBell** - Utilise les variables CSS
✅ **NotificationPanel** - Utilise les variables CSS
✅ **ModernProfile** - À adapter (TODO)
✅ **ModernStudentDashboard** - À adapter (TODO)
✅ **SimpleAdminDashboard** - À adapter (TODO)

---

### 13. 🚀 **Prochaines Étapes**

#### **Phase 1: Composants Principaux** ✅
- [x] ThemeContext
- [x] ThemeToggle
- [x] Variables CSS
- [x] API endpoint
- [x] Intégration Navbar

#### **Phase 2: Pages** 🔄
- [ ] ModernProfile
- [ ] ModernStudentDashboard
- [ ] SimpleAdminDashboard
- [ ] Forum
- [ ] Flashcards
- [ ] KnowledgeTests

#### **Phase 3: Composants Secondaires**
- [ ] Login/Register
- [ ] Modals
- [ ] Forms
- [ ] Tables

---

### 14. 💡 **Astuces**

#### **Détecter le thème actuel**
```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { theme } = useTheme();
// theme = 'light' | 'dark'
```

#### **Images adaptatives**
```tsx
<img 
  src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} 
  alt="Logo" 
/>

// Ou avec CSS
<img 
  src="/logo-light.png" 
  className="dark:hidden"
  alt="Logo" 
/>
<img 
  src="/logo-dark.png" 
  className="hidden dark:block"
  alt="Logo" 
/>
```

#### **Gradients adaptatifs**
```tsx
<div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-900">
  Contenu
</div>
```

---

### 15. 🐛 **Problèmes Courants**

#### **Le thème ne change pas**
- Vérifier que `ThemeProvider` entoure l'app
- Vérifier la console pour les erreurs
- Vider le cache du navigateur

#### **Classes Tailwind ne fonctionnent pas**
- Vérifier que `darkMode: ["class"]` est dans `tailwind.config.ts`
- Rebuild le projet: `npm run dev`

#### **Le thème ne persiste pas**
- Vérifier localStorage: `localStorage.getItem('theme')`
- Vérifier que l'API endpoint fonctionne
- Vérifier le token JWT

---

### 16. 📚 **Ressources**

- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Shadcn Theming](https://ui.shadcn.com/docs/theming)
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

---

*Document créé le ${new Date().toLocaleDateString('fr-FR')}*
*Version 1.0.0*
*Système de thème Tyala Platform*



