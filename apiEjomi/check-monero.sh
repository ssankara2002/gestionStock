#!/bin/bash

# Script de vérification des services Monero
# Usage: ./check-monero.sh

echo "🔍 Vérification des services Monero..."
echo "======================================"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test daemon Monero
echo -n "📡 Daemon Monero (port 18081) : "
if curl -s -m 5 -X POST http://localhost:18081/json_rpc \
   -H 'Content-Type: application/json' \
   -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ACTIF${NC}"

    # Obtenir infos du daemon
    INFO=$(curl -s -X POST http://localhost:18081/json_rpc \
           -H 'Content-Type: application/json' \
           -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}')

    HEIGHT=$(echo $INFO | jq -r '.result.height // "?"')
    TESTNET=$(echo $INFO | jq -r '.result.testnet // false')

    echo "   📈 Hauteur bloc : $HEIGHT"
    echo "   🧪 Mode testnet : $TESTNET"
else
    echo -e "${RED}❌ INACTIF${NC}"
    echo -e "${YELLOW}💡 Pour démarrer : monerod --testnet --rpc-bind-port 18081 --detach${NC}"
fi

echo ""

# Test wallet RPC
echo -n "👛 Wallet RPC (port 18083) : "
if curl -s -m 5 -X POST http://localhost:18083/json_rpc \
   -H 'Content-Type: application/json' \
   -d '{"jsonrpc":"2.0","id":"0","method":"get_balance"}' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ACTIF${NC}"

    # Obtenir solde
    BALANCE_INFO=$(curl -s -X POST http://localhost:18083/json_rpc \
                   -H 'Content-Type: application/json' \
                   -d '{"jsonrpc":"2.0","id":"0","method":"get_balance"}')

    BALANCE=$(echo $BALANCE_INFO | jq -r '.result.balance // "?"')
    UNLOCKED=$(echo $BALANCE_INFO | jq -r '.result.unlocked_balance // "?"')

    # Convertir atomic units vers XMR
    if [[ "$BALANCE" != "?" ]] && [[ "$BALANCE" != "null" ]]; then
        BALANCE_XMR=$(echo "scale=12; $BALANCE / 1000000000000" | bc -l 2>/dev/null || echo "?")
        UNLOCKED_XMR=$(echo "scale=12; $UNLOCKED / 1000000000000" | bc -l 2>/dev/null || echo "?")
        echo "   💰 Solde total : $BALANCE_XMR XMR"
        echo "   🔓 Disponible : $UNLOCKED_XMR XMR"
    else
        echo "   💰 Solde : Non disponible"
    fi
else
    echo -e "${RED}❌ INACTIF${NC}"
    echo -e "${YELLOW}💡 Pour démarrer : monero-wallet-rpc --testnet --wallet-file wallet --rpc-bind-port 18083 --detach${NC}"
fi

echo ""

# Test API de l'école (si disponible)
echo -n "🏫 API École (port 5000) : "
if curl -s -m 5 http://localhost:5000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ACTIF${NC}"

    # Test endpoint Monero (nécessite un token valide)
    echo "   🔗 Endpoints Monero disponibles :"
    echo "      POST /paiements/monero/generate-address"
    echo "      POST /paiements/monero/check-payment"
    echo "      GET  /admin/monero/balance"
else
    echo -e "${RED}❌ INACTIF${NC}"
    echo -e "${YELLOW}💡 Pour démarrer : cd gestionEcole/api && npm start${NC}"
fi

echo ""
echo "📋 Résumé :"
echo "==========="

# Statut global
DAEMON_OK=$(curl -s -m 2 http://localhost:18081/json_rpc > /dev/null 2>&1 && echo "true" || echo "false")
WALLET_OK=$(curl -s -m 2 http://localhost:18083/json_rpc > /dev/null 2>&1 && echo "true" || echo "false")
API_OK=$(curl -s -m 2 http://localhost:5000 > /dev/null 2>&1 && echo "true" || echo "false")

if [[ "$DAEMON_OK" == "true" ]] && [[ "$WALLET_OK" == "true" ]]; then
    echo -e "${GREEN}✅ Services Monero : OPÉRATIONNELS${NC}"
    if [[ "$API_OK" == "true" ]]; then
        echo -e "${GREEN}✅ Système complet : PRÊT POUR LES PAIEMENTS${NC}"
        echo ""
        echo -e "${BLUE}🚀 Test rapide :${NC}"
        echo "curl -X POST http://localhost:5000/paiements/monero/generate-address \\"
        echo "  -H 'Content-Type: application/json' \\"
        echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
        echo "  -d '{\"montant\": 50000, \"currency\": \"XOF\"}'"
    else
        echo -e "${YELLOW}⚠️  API École : À démarrer${NC}"
    fi
else
    echo -e "${RED}❌ Services Monero : INCOMPLETS${NC}"
    echo ""
    echo -e "${BLUE}🔧 Actions requises :${NC}"

    if [[ "$DAEMON_OK" == "false" ]]; then
        echo "1. Démarrer le daemon : monerod --testnet --rpc-bind-port 18081 --detach"
    fi

    if [[ "$WALLET_OK" == "false" ]]; then
        echo "2. Démarrer le wallet : monero-wallet-rpc --testnet --wallet-file wallet --rpc-bind-port 18083 --detach"
    fi
fi

echo ""
echo -e "${BLUE}📖 Documentation :${NC}"
echo "   - Guide installation : INSTALL_MONERO.md"
echo "   - Guide CFA : MONERO_CFA_GUIDE.md"
echo "   - Test complet : node test_monero.js"