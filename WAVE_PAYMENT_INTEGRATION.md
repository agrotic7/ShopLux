# 💳 Intégration Wave Payment - ShopLux

## 🔗 Lien de paiement Wave
**URL :** https://pay.wave.com/m/M_sn_l1suFj7U33OF/c/sn/

## 📋 Configuration

### Fichiers d'environnement
Le lien Wave est configuré dans les fichiers d'environnement :

#### `src/environments/environment.ts` (développement)
```typescript
wave: {
  paymentUrl: 'https://pay.wave.com/m/M_sn_l1suFj7U33OF/c/sn/'
}
```

#### `src/environments/environment.prod.ts` (production)
```typescript
wave: {
  paymentUrl: 'https://pay.wave.com/m/M_sn_l1suFj7U33OF/c/sn/'
}
```

## 🔄 Fonctionnement

### 1. Sélection du paiement Wave
- L'utilisateur sélectionne "Wave" comme méthode de paiement
- Il saisit son numéro de téléphone Wave
- Il valide sa commande

### 2. Traitement du paiement
- Une transaction est créée dans la base de données avec le statut `pending`
- L'utilisateur est redirigé vers le lien Wave dans un nouvel onglet
- L'utilisateur effectue le paiement sur la page Wave sécurisée

### 3. Confirmation
- Après le paiement, l'utilisateur peut fermer l'onglet Wave
- La commande est enregistrée avec le statut "en attente de confirmation"
- Un email de confirmation est envoyé automatiquement

## 📁 Fichiers modifiés

### Service de paiement
**Fichier :** `src/app/core/services/payment.service.ts`

```typescript
async processWavePayment(amount: number, phoneNumber: string, orderId: string): Promise<boolean> {
  try {
    // Créer la transaction dans la base de données
    const transactionId = `wave_${Date.now()}`;
    
    await this.createPaymentTransaction(
      orderId,
      transactionId,
      'wave',
      amount,
      'XOF',
      'pending'
    );

    // Rediriger vers le lien de paiement Wave
    const wavePaymentUrl = environment.wave?.paymentUrl || 'https://pay.wave.com/m/M_sn_l1suFj7U33OF/c/sn/';
    
    // Ouvrir le lien Wave dans un nouvel onglet
    window.open(wavePaymentUrl, '_blank');

    return true;
  } catch (error) {
    console.error('Error processing Wave payment:', error);
    return false;
  }
}
```

### Méthodes de paiement disponibles
```typescript
getAvailablePaymentMethods() {
  return [
    {
      id: 'cash_on_delivery',
      name: 'Paiement à la livraison',
      description: 'Payez en espèces à la réception',
      icon: '💵',
      provider: 'cod'
    },
    {
      id: 'wave',
      name: 'Wave',
      description: 'Paiement mobile',
      icons: ['/assets/wave.png'],
      provider: 'wave'
    },
    {
      id: 'orange_money',
      name: 'Orange Money',
      description: 'Paiement mobile',
      icons: ['/assets/OM.png'],
      provider: 'orange_money'
    }
  ];
}
```

## 🎨 Interface utilisateur

### Message d'information
Un message informatif est affiché quand l'utilisateur sélectionne Wave :

```html
<div class="p-4 bg-blue-50 rounded-xl border border-blue-200">
  <p class="text-sm text-blue-900">
    💡 <strong>Information :</strong> Vous serez redirigé vers Wave pour finaliser votre paiement de manière sécurisée.
  </p>
</div>
```

## 🔐 Sécurité

- ✅ Le lien Wave est sécurisé (HTTPS)
- ✅ L'utilisateur est redirigé vers la plateforme officielle Wave
- ✅ Les transactions sont enregistrées dans la base de données
- ✅ Un ID unique est généré pour chaque transaction

## 📊 Base de données

### Table `payment_transactions`
Chaque paiement Wave crée un enregistrement avec :
- `order_id` : ID de la commande
- `transaction_id` : ID unique de la transaction (format: `wave_timestamp`)
- `payment_provider` : 'wave'
- `amount` : Montant en FCFA
- `currency` : 'XOF'
- `status` : 'pending' (en attente de confirmation)

## 🚀 Déploiement

### Variables d'environnement Vercel
Aucune variable d'environnement supplémentaire n'est requise car le lien Wave est directement configuré dans les fichiers d'environnement.

### Mise à jour du lien Wave
Pour modifier le lien Wave :
1. Éditez `src/environments/environment.ts`
2. Éditez `src/environments/environment.prod.ts`
3. Reconstruisez l'application : `npm run build`
4. Déployez sur Vercel

## 📱 Test

### En développement
1. Lancez l'application : `ng serve`
2. Ajoutez des produits au panier
3. Accédez au checkout
4. Sélectionnez "Wave" comme méthode de paiement
5. Entrez votre numéro de téléphone
6. Validez la commande
7. Vérifiez que le lien Wave s'ouvre dans un nouvel onglet

### En production
Même processus, mais l'utilisateur sera redirigé vers la page Wave réelle pour effectuer le paiement.

## 💡 Améliorations futures possibles

1. **Webhook Wave** : Recevoir des confirmations automatiques de paiement
2. **API Wave** : Intégration complète avec l'API Wave pour créer des paiements dynamiques
3. **Montant personnalisé** : Générer un lien Wave avec le montant exact
4. **Statut en temps réel** : Vérifier automatiquement si le paiement a été effectué
5. **QR Code** : Afficher un QR code pour payer directement depuis l'application mobile Wave

## 📞 Support

Pour toute question concernant l'intégration Wave, contactez :
- **Wave Support** : https://www.wave.com/support
- **Documentation Wave** : https://developer.wave.com

---

**Dernière mise à jour :** 8 octobre 2025

