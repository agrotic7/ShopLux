# 📊 Configuration Google Analytics 4 - ShopLux

## 🎯 Événements E-commerce Trackés

### 📈 Événements Automatiques
- **Page Views** - Toutes les pages visitées
- **Scroll Tracking** - Profondeur de scroll (25%, 50%, 75%, 90%, 100%)
- **Engagement Time** - Temps passé sur chaque page
- **Error Tracking** - Erreurs JavaScript et console

### 🛒 Événements E-commerce
- **view_item** - Produit consulté
- **add_to_cart** - Produit ajouté au panier
- **remove_from_cart** - Produit retiré du panier
- **view_cart** - Panier consulté
- **begin_checkout** - Début du processus de commande
- **purchase** - Commande complétée

### 🔍 Événements Utilisateur
- **search** - Recherche de produits
- **click** - Clics sur liens et boutons
- **login** - Connexion utilisateur
- **logout** - Déconnexion utilisateur
- **sign_up** - Inscription newsletter

## ⚙️ Configuration

### 1. Remplacer l'ID de mesure
Dans `src/index.html` et `src/app/core/services/analytics.service.ts` :
```typescript
private measurementId = 'G-XXXXXXXXXX'; // Remplacez par votre ID GA4
```

### 2. Créer un compte GA4
1. Aller sur [Google Analytics](https://analytics.google.com/)
2. Créer un nouveau compte
3. Choisir "Web" comme plateforme
4. Copier l'ID de mesure (format: G-XXXXXXXXXX)

### 3. Configuration des objectifs
Dans GA4, créer ces objectifs :
- **Achat** : Événement `purchase`
- **Ajout au panier** : Événement `add_to_cart`
- **Consultation produit** : Événement `view_item`
- **Recherche** : Événement `search`

## 📊 Rapports Disponibles

### E-commerce
- **Conversion funnel** : view_item → add_to_cart → begin_checkout → purchase
- **Revenue tracking** : Valeur des commandes en XOF
- **Product performance** : Produits les plus vus/achetés
- **Category analysis** : Performance par catégorie

### Engagement
- **Page views** : Pages les plus visitées
- **Scroll depth** : Profondeur de lecture
- **Time on site** : Temps d'engagement
- **Bounce rate** : Taux de rebond

### Utilisateur
- **User journey** : Parcours utilisateur
- **Device analytics** : Mobile vs Desktop
- **Geographic data** : Localisation (Sénégal)
- **Return visitors** : Visiteurs récurrents

## 🚀 Utilisation Avancée

### Événements Personnalisés
```typescript
// Dans n'importe quel composant
constructor(private analyticsService: AnalyticsService) {}

// Track un événement personnalisé
this.analyticsService.trackCustomEvent('newsletter_signup', {
  method: 'email',
  source: 'footer'
});
```

### Tracking des Conversions
```typescript
// Track une commande
this.analyticsService.trackPurchase({
  transaction_id: 'ORDER-123',
  value: 25000,
  currency: 'XOF',
  items: [{
    item_id: 'PROD-1',
    item_name: 'Produit Test',
    category: 'Électronique',
    price: 25000,
    quantity: 1,
    currency: 'XOF'
  }]
});
```

## 🔧 Debug et Test

### Mode Debug
Ajouter dans `src/index.html` :
```html
<script>
  gtag('config', 'G-XXXXXXXXXX', {
    debug_mode: true
  });
</script>
```

### Vérification
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Network"
3. Filtrer par "google-analytics"
4. Vérifier que les événements sont envoyés

### Google Tag Assistant
Installer l'extension Chrome "Tag Assistant" pour vérifier l'implémentation.

## 📱 Mobile & PWA

Le tracking fonctionne automatiquement sur :
- **Mobile web** : Tous les événements trackés
- **PWA installée** : Même tracking que web
- **Mode hors-ligne** : Événements mis en cache et envoyés à la reconnexion

## 🎯 Optimisations

### Performance
- Scripts chargés de manière asynchrone
- Événements mis en batch
- Pas d'impact sur la vitesse de chargement

### Privacy
- Conformité RGPD
- Pas de données personnelles sensibles
- Anonymisation des IPs

## 📈 Métriques Clés à Surveiller

1. **Conversion Rate** : Achat / Visiteurs
2. **Cart Abandonment** : begin_checkout / add_to_cart
3. **Product Performance** : view_item / add_to_cart
4. **Search Effectiveness** : search / view_item
5. **Mobile Performance** : Métriques par device

---

**🎉 Votre site ShopLux est maintenant entièrement tracké avec Google Analytics 4 !**
