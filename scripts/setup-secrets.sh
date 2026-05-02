#!/bin/bash
# setup-secrets.sh
# Configura secrets para todos os repositórios de serviço
# Uso: ./setup-secrets.sh <AZURE_CLIENT_ID> <AZURE_TENANT_ID> <AZURE_SUBSCRIPTION_ID>

set -e

if [ $# -lt 3 ]; then
    echo "Uso: $0 <AZURE_CLIENT_ID> <AZURE_TENANT_ID> <AZURE_SUBSCRIPTION_ID>"
    echo ""
    echo "Exemplo:"
    echo "  $0 12345678-abcd-...  98765432-dcba-...  12345678-1234-..."
    exit 1
fi

AZURE_CLIENT_ID="$1"
AZURE_TENANT_ID="$2"
AZURE_SUBSCRIPTION_ID="$3"

# Valores padrão (substitua ou use env vars)
AKS_RESOURCE_GROUP="${AKS_RESOURCE_GROUP:-rg-ct-framework}"
AKS_CLUSTER_NAME="${AKS_CLUSTER_NAME:-aks-ct-framework}"
ACR_NAME="${ACR_NAME:-acrctframework}"
ACR_LOGIN_SERVER="${ACR_LOGIN_SERVER:-acrctframework.azurecr.io}"

REPOS=(
    "Dorigao-LTDA/svc-catalogo"
    "Dorigao-LTDA/svc-pagamento"
    "Dorigao-LTDA/svc-pedido"
)

echo "=========================================="
echo "🔐 Configurando secrets para repositórios"
echo "=========================================="
echo ""

for repo in "${REPOS[@]}"; do
    echo "→ Configurando $repo..."
    
    # Secrets críticos
    gh secret set AZURE_CLIENT_ID --body "$AZURE_CLIENT_ID" --repo "$repo"
    gh secret set AZURE_TENANT_ID --body "$AZURE_TENANT_ID" --repo "$repo"
    gh secret set AZURE_SUBSCRIPTION_ID --body "$AZURE_SUBSCRIPTION_ID" --repo "$repo"
    
    # Secrets de infra
    gh secret set AKS_RESOURCE_GROUP --body "$AKS_RESOURCE_GROUP" --repo "$repo"
    gh secret set AKS_CLUSTER_NAME --body "$AKS_CLUSTER_NAME" --repo "$repo"
    
    # Variables (não sensíveis)
    gh variable set ACR_NAME --body "$ACR_NAME" --repo "$repo"
    gh variable set ACR_LOGIN_SERVER --body "$ACR_LOGIN_SERVER" --repo "$repo"
    
    echo "  ✅ $repo configurado"
done

echo ""
echo "✅ Todos os repositórios configurados!"
echo ""
echo "Verificar:"
for repo in "${REPOS[@]}"; do
    echo "  gh secret list --repo $repo"
done
