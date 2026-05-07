$siteId = "bf08d94a-710c-4ada-8df1-2cac0479a122"
$token = "nfp_DKotn2G8M1jSpCkt9ZBE7wRLBG2vr3VP3f09"
$url = "https://api.netlify.com/api/v1/sites/$siteId"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    build_settings = @{
        env = @{
            VITE_SUPABASE_URL = "https://qjksxsekhdjliqlecazy.supabase.co"
            VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa3N4c2VraGRqbGlxbGVjYXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDQxNDksImV4cCI6MjA5MzIyMDE0OX0.fXvcyooLCy1t-AyGuNdQUSrW-79WsSf5SFFAzs7eJh0"
            SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa3N4c2VraGRqbGlxbGVjYXp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY0NDE0OSwiZXhwIjoyMDkzMjIwMTQ5fQ.i3aTBdZVoVDAcNheKI5kNnMeFmwoqWRGQ-5KSzidmhg"
            VITE_GEMINI_API_KEY = "AIzaSyAWPRtpDf0xaNZdb_8QdFbfDMQ3yrgCQaE"
            VITE_OFFLINE_MODE = "false"
            VITE_APP_VERSION = "2.4.0"
            VITE_ML_CLIENT_ID = "5493650858037224"
            VITE_ML_CLIENT_SECRET = "7TCbJBZC3hOzJCfIWCrilOPQr7jC1YodR"
        }
    }
} | ConvertTo-Json -Depth 5

try {
    Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body $body
    Write-Host "SUCCESS: Build settings updated with env vars."
} catch {
    Write-Host "FAILURE: $($_.Exception.Message)"
    $_.ErrorDetails.Message | Write-Host
}
