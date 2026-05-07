$siteId = "bf08d94a-710c-4ada-8df1-2cac0479a122"
$token = "nfp_DKotn2G8M1jSpCkt9ZBE7wRLBG2vr3VP3f09"
$url = "https://api.netlify.com/api/v1/sites/$siteId/env"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @(
    @{
        key = "VITE_SUPABASE_URL"
        values = @(@{ value = "https://qjksxsekhdjliqlecazy.supabase.co"; context = "all" })
    },
    @{
        key = "VITE_SUPABASE_ANON_KEY"
        values = @(@{ value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa3N4c2VraGRqbGlxbGVjYXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDQxNDksImV4cCI6MjA5MzIyMDE0OX0.fXvcyooLCy1t-AyGuNdQUSrW-79WsSf5SFFAzs7eJh0"; context = "all" })
    },
    @{
        key = "SUPABASE_SERVICE_ROLE_KEY"
        values = @(@{ value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa3N4c2VraGRqbGlxbGVjYXp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY0NDE0OSwiZXhwIjoyMDkzMjIwMTQ5fQ.i3aTBdZVoVDAcNheKI5kNnMeFmwoqWRGQ-5KSzidmhg"; context = "all" })
    },
    @{
        key = "VITE_GEMINI_API_KEY"
        values = @(@{ value = "AIzaSyAWPRtpDf0xaNZdb_8QdFbfDMQ3yrgCQaE"; context = "all" })
    },
    @{
        key = "VITE_OFFLINE_MODE"
        values = @(@{ value = "false"; context = "all" })
    },
    @{
        key = "VITE_APP_VERSION"
        values = @(@{ value = "2.4.0"; context = "all" })
    },
    @{
        key = "VITE_ML_CLIENT_ID"
        values = @(@{ value = "5493650858037224"; context = "all" })
    },
    @{
        key = "VITE_ML_CLIENT_SECRET"
        values = @(@{ value = "7TCbJBZC3hOzJCfIWCrilOPQr7jC1YodR"; context = "all" })
    }
) | ConvertTo-Json -Depth 5

try {
    Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body $body
    Write-Host "SUCCESS: Env vars configured."
} catch {
    Write-Host "FAILURE: $($_.Exception.Message)"
    $_.ErrorDetails.Message | Write-Host
}
