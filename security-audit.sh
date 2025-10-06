#!/bin/bash

# ============================================
# 🔒 SCRIPT D'AUDIT DE SÉCURITÉ - ShopLux
# ============================================
# Ce script vérifie les vulnérabilités de sécurité

echo "🔍 Audit de sécurité ShopLux"
echo "============================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCORE=0
TOTAL=0

# ============================================
# 1. Vérifier les dépendances vulnérables
# ============================================
echo "1️⃣  Vérification des dépendances npm..."
TOTAL=$((TOTAL + 10))

if npm audit --production > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Aucune vulnérabilité critique${NC}"
    SCORE=$((SCORE + 10))
else
    VULN_COUNT=$(npm audit --production --json 2>/dev/null | grep -o '"severity":"high"' | wc -l)
    if [ "$VULN_COUNT" -gt 0 ]; then
        echo -e "${RED}❌ $VULN_COUNT vulnérabilités trouvées${NC}"
        echo "   Exécutez: npm audit fix"
    else
        echo -e "${YELLOW}⚠️  Vulnérabilités mineures détectées${NC}"
        SCORE=$((SCORE + 5))
    fi
fi
echo ""

# ============================================
# 2. Vérifier les secrets dans le code
# ============================================
echo "2️⃣  Recherche de secrets exposés..."
TOTAL=$((TOTAL + 10))

SECRETS_FOUND=0

# Rechercher les patterns de clés API
if grep -r "AKIA" --include="*.ts" --include="*.js" src/ > /dev/null 2>&1; then
    echo -e "${RED}❌ Clés AWS trouvées dans le code${NC}"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
fi

if grep -r "sk_live_" --include="*.ts" --include="*.js" src/ > /dev/null 2>&1; then
    echo -e "${RED}❌ Clés Stripe privées trouvées${NC}"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
fi

if grep -r "AIza" --include="*.ts" --include="*.js" src/ > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Clés Google API trouvées (vérifier si publiques)${NC}"
fi

if [ "$SECRETS_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun secret critique exposé${NC}"
    SCORE=$((SCORE + 10))
else
    echo -e "${RED}❌ $SECRETS_FOUND types de secrets trouvés${NC}"
fi
echo ""

# ============================================
# 3. Vérifier la configuration RLS
# ============================================
echo "3️⃣  Vérification Row Level Security (RLS)..."
TOTAL=$((TOTAL + 15))

if [ -f "supabase/migrations/20251007000000_secure_rls_final.sql" ]; then
    echo -e "${GREEN}✅ Migration de sécurité RLS présente${NC}"
    SCORE=$((SCORE + 15))
else
    echo -e "${RED}❌ Migration de sécurité RLS manquante${NC}"
    echo "   Exécutez: supabase db push"
fi
echo ""

# ============================================
# 4. Vérifier les headers de sécurité
# ============================================
echo "4️⃣  Vérification headers HTTP..."
TOTAL=$((TOTAL + 10))

if [ -f "vercel.json" ]; then
    HEADERS_COUNT=$(grep -o "key" vercel.json | wc -l)
    if [ "$HEADERS_COUNT" -ge 6 ]; then
        echo -e "${GREEN}✅ Headers de sécurité configurés ($HEADERS_COUNT headers)${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${YELLOW}⚠️  Headers de sécurité incomplets${NC}"
        SCORE=$((SCORE + 5))
    fi
else
    echo -e "${RED}❌ vercel.json manquant${NC}"
fi
echo ""

# ============================================
# 5. Vérifier les guards Angular
# ============================================
echo "5️⃣  Vérification guards de protection..."
TOTAL=$((TOTAL + 10))

if [ -f "src/app/core/guards/auth.guard.ts" ]; then
    if grep -q "adminGuard" src/app/core/guards/auth.guard.ts; then
        echo -e "${GREEN}✅ Guards authGuard et adminGuard présents${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${YELLOW}⚠️  adminGuard manquant${NC}"
        SCORE=$((SCORE + 5))
    fi
else
    echo -e "${RED}❌ Fichier auth.guard.ts manquant${NC}"
fi
echo ""

# ============================================
# 6. Vérifier les fichiers sensibles
# ============================================
echo "6️⃣  Vérification fichiers sensibles..."
TOTAL=$((TOTAL + 10))

ISSUES=0

if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Fichier .env présent (vérifier .gitignore)${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Fichier .env.local présent${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "src/environments/environment.ts" ]; then
    if grep -q "YOUR_" src/environments/environment.ts; then
        echo -e "${YELLOW}⚠️  Placeholders dans environment.ts${NC}"
        ISSUES=$((ISSUES + 1))
    fi
fi

if [ "$ISSUES" -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun fichier sensible problématique${NC}"
    SCORE=$((SCORE + 10))
else
    SCORE=$((SCORE + 5))
fi
echo ""

# ============================================
# 7. Vérifier HTTPS
# ============================================
echo "7️⃣  Vérification HTTPS..."
TOTAL=$((TOTAL + 10))

if grep -q "Strict-Transport-Security" vercel.json 2>/dev/null; then
    echo -e "${GREEN}✅ HSTS configuré${NC}"
    SCORE=$((SCORE + 10))
else
    echo -e "${YELLOW}⚠️  HSTS non configuré${NC}"
    SCORE=$((SCORE + 5))
fi
echo ""

# ============================================
# 8. Vérifier les validations
# ============================================
echo "8️⃣  Vérification validations de formulaires..."
TOTAL=$((TOTAL + 10))

VALIDATION_COUNT=$(grep -r "Validators\." src/ | wc -l)
if [ "$VALIDATION_COUNT" -gt 10 ]; then
    echo -e "${GREEN}✅ Validations trouvées ($VALIDATION_COUNT occurrences)${NC}"
    SCORE=$((SCORE + 10))
else
    echo -e "${YELLOW}⚠️  Peu de validations trouvées${NC}"
    SCORE=$((SCORE + 5))
fi
echo ""

# ============================================
# 9. Vérifier les logs console
# ============================================
echo "9️⃣  Vérification console.log en production..."
TOTAL=$((TOTAL + 5))

CONSOLE_COUNT=$(grep -r "console\.log" --include="*.ts" src/ | grep -v "console.error" | wc -l)
if [ "$CONSOLE_COUNT" -gt 20 ]; then
    echo -e "${YELLOW}⚠️  $CONSOLE_COUNT console.log trouvés (données sensibles?)${NC}"
    SCORE=$((SCORE + 2))
else
    echo -e "${GREEN}✅ Peu de console.log ($CONSOLE_COUNT)${NC}"
    SCORE=$((SCORE + 5))
fi
echo ""

# ============================================
# 10. Vérifier documentation de sécurité
# ============================================
echo "🔟 Vérification documentation..."
TOTAL=$((TOTAL + 10))

if [ -f "SECURITY.md" ]; then
    echo -e "${GREEN}✅ Documentation de sécurité présente${NC}"
    SCORE=$((SCORE + 10))
else
    echo -e "${RED}❌ SECURITY.md manquant${NC}"
fi
echo ""

# ============================================
# RÉSULTAT FINAL
# ============================================
echo "=============================="
echo "📊 RÉSULTAT DE L'AUDIT"
echo "=============================="

PERCENTAGE=$((SCORE * 100 / TOTAL))

echo "Score: $SCORE / $TOTAL ($PERCENTAGE%)"
echo ""

if [ "$PERCENTAGE" -ge 90 ]; then
    echo -e "${GREEN}✅ EXCELLENT - Votre application est bien sécurisée${NC}"
elif [ "$PERCENTAGE" -ge 75 ]; then
    echo -e "${GREEN}✅ BON - Sécurité satisfaisante avec quelques améliorations possibles${NC}"
elif [ "$PERCENTAGE" -ge 60 ]; then
    echo -e "${YELLOW}⚠️  MOYEN - Des améliorations sont recommandées${NC}"
else
    echo -e "${RED}❌ FAIBLE - Action immédiate requise${NC}"
fi

echo ""
echo "📝 Recommandations:"
echo "1. Exécutez 'npm audit fix' régulièrement"
echo "2. Vérifiez que RLS est actif sur Supabase"
echo "3. Activez 2FA pour les comptes admins"
echo "4. Faites des backups réguliers"
echo "5. Consultez SECURITY.md pour plus de détails"
echo ""

# Retourner 0 si score > 70%, sinon 1
if [ "$PERCENTAGE" -ge 70 ]; then
    exit 0
else
    exit 1
fi

