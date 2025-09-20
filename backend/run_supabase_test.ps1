$envFile = Join-Path $PSScriptRoot "..\.env"
if (-Not (Test-Path $envFile)) { Write-Error "Env file not found: $envFile"; exit 1 }
Get-Content $envFile | ForEach-Object {
    if ($_ -and -not $_.Trim().StartsWith('#')) {
        $pair = $_ -split '=', 2
        if ($pair.Length -eq 2) {
            $name = $pair[0].Trim()
            $value = $pair[1].Trim()
            if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Trim('"') }
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}
Write-Host "Environment loaded. Running test..."
python .\scripts\supabase_progress_test.py
