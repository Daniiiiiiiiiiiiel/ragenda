$ErrorActionPreference = "Continue"

function Set-VercelEnv {
    param([string]$Key, [string]$Value, [string]$Project)
    Write-Host "Setting $Key for $Project..."
    $Value | npx vercel env add $Key production $Project --yes
}

$DatabaseURL = "postgresql://postgres.mfcylpewsqkpdxpzukrj:er8dg8NbzLkascWL@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
$DirectURL = "postgresql://postgres.mfcylpewsqkpdxpzukrj:er8dg8NbzLkascWL@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

# WEB APP
Write-Host "Deploying WEB..."
npx vercel link --yes --project ragenda-web-v6 --cwd apps/web
Set-VercelEnv "DATABASE_URL" $DatabaseURL "ragenda-web-v6"
Set-VercelEnv "DIRECT_URL" $DirectURL "ragenda-web-v6"
Set-VercelEnv "JWT_SECRET" "ragenda_super_secret_access_token_123" "ragenda-web-v6"
Set-VercelEnv "REFRESH_TOKEN_SECRET" "ragenda_super_secret_refresh_token_456" "ragenda-web-v6"
Set-VercelEnv "RESEND_API_KEY" "re_test_key_123" "ragenda-web-v6"
Set-VercelEnv "EMAIL_FROM" "RaGenda <onboarding@resend.dev>" "ragenda-web-v6"
npx vercel deploy --prod --yes --cwd apps/web
Write-Host "WEB Deployed!"

# ADMIN APP
Write-Host "Deploying ADMIN..."
npx vercel link --yes --project ragenda-admin-v6 --cwd apps/admin
Set-VercelEnv "DATABASE_URL" $DatabaseURL "ragenda-admin-v6"
Set-VercelEnv "DIRECT_URL" $DirectURL "ragenda-admin-v6"
Set-VercelEnv "JWT_SECRET" "ragenda_super_secret_access_token_123" "ragenda-admin-v6"
Set-VercelEnv "REFRESH_TOKEN_SECRET" "ragenda_super_secret_refresh_token_456" "ragenda-admin-v6"
npx vercel deploy --prod --yes --cwd apps/admin
Write-Host "ADMIN Deployed!"
