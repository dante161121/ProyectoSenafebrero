param(
    [switch]$OnlyBackend,
    [switch]$OnlyFrontend,
    [switch]$ForceRestart,
    [switch]$Stop,
    [switch]$Status,
    [switch]$Help
)

$ProjectRoot = $PSScriptRoot
$BackendPath = Join-Path $ProjectRoot 'backend'
$BackendPort = 5000
$FrontendPorts = @(3000, 3001)
$PrimaryFrontendPort = 3000
$BackendHealthUrl = "http://localhost:$BackendPort/health"
$FrontendHealthUrl = "http://localhost:$PrimaryFrontendPort/proyectopages/index.html"

function Show-Help {
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "IN OUT MANAGER - GESTOR DE SERVICIOS" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Green
    Write-Host "  npm run start:both                Inicia o reutiliza backend y frontend"
    Write-Host "  .\start-both.ps1 -OnlyBackend     Inicia o reutiliza solo backend"
    Write-Host "  .\start-both.ps1 -OnlyFrontend    Inicia o reutiliza solo frontend"
    Write-Host "  .\start-both.ps1 -ForceRestart    Reinicia los servicios aunque estén sanos"
    Write-Host "  .\start-both.ps1 -Stop            Detiene puertos 5000, 3000 y 3001"
    Write-Host "  .\start-both.ps1 -Status          Muestra el estado actual de puertos y URLs"
    Write-Host ""
    Write-Host "Puertos reales:" -ForegroundColor Green
    Write-Host "  Backend:  http://localhost:5000"
    Write-Host "  Frontend: http://localhost:3000/proyectopages/index.html"
    Write-Host ""
}

function Test-CommandAvailable {
    param([string]$CommandName)

    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Test-UrlHealthy {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 5
    )

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSeconds
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    }
    catch {
        return $false
    }
}

function Get-ListeningProcessIds {
    param([int[]]$Ports)

    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in $Ports } |
        Select-Object -ExpandProperty OwningProcess -Unique

    if (-not $connections) {
        return @()
    }

    return @($connections)
}

function Stop-Ports {
    param(
        [int[]]$Ports,
        [string]$Label
    )

    $processIds = Get-ListeningProcessIds -Ports $Ports
    if ($processIds.Count -eq 0) {
        Write-Host "${Label}: no hay procesos ocupando los puertos $($Ports -join ', ')" -ForegroundColor DarkGray
        return
    }

    foreach ($processId in $processIds) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "${Label}: proceso $processId detenido" -ForegroundColor Yellow
        }
        catch {
            Write-Host "${Label}: no se pudo detener el proceso $processId - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

function Wait-ForUrl {
    param(
        [string]$Url,
        [int]$Retries = 20,
        [int]$DelaySeconds = 1
    )

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        if (Test-UrlHealthy -Url $Url -TimeoutSeconds 5) {
            return $true
        }
        Start-Sleep -Seconds $DelaySeconds
    }

    return $false
}

function Remove-ExistingServiceJobs {
    param([string]$JobName)

    Get-Job -Name $JobName -ErrorAction SilentlyContinue |
        Remove-Job -Force -ErrorAction SilentlyContinue
}

function Start-BackendProcess {
    Write-Host "Backend: iniciando en puerto $BackendPort..." -ForegroundColor Yellow
    Remove-ExistingServiceJobs -JobName 'inoutmanager-backend'
    Start-Job -Name 'inoutmanager-backend' -ScriptBlock {
        param($BackendPath)
        Set-Location $BackendPath
        node server.js
    } -ArgumentList $BackendPath | Out-Null
}

function Start-FrontendProcess {
    Write-Host "Frontend: iniciando en puerto $PrimaryFrontendPort..." -ForegroundColor Yellow
    Remove-ExistingServiceJobs -JobName 'inoutmanager-frontend'
    Start-Job -Name 'inoutmanager-frontend' -ScriptBlock {
        param($ProjectRoot)
        Set-Location $ProjectRoot
        npm run start:frontend
    } -ArgumentList $ProjectRoot | Out-Null
}

function Ensure-Backend {
    if (-not $ForceRestart -and (Test-UrlHealthy -Url $BackendHealthUrl)) {
        Write-Host "Backend: reutilizando instancia sana en $BackendHealthUrl" -ForegroundColor Green
        return
    }

    Stop-Ports -Ports @($BackendPort) -Label 'Backend'
    Start-BackendProcess

    if (-not (Wait-ForUrl -Url $BackendHealthUrl)) {
        throw "Backend: no respondió correctamente en $BackendHealthUrl"
    }

    Write-Host "Backend: listo en $BackendHealthUrl" -ForegroundColor Green
}

function Ensure-Frontend {
    if (-not $ForceRestart -and (Test-UrlHealthy -Url $FrontendHealthUrl)) {
        Write-Host "Frontend: reutilizando instancia sana en $FrontendHealthUrl" -ForegroundColor Green
        return
    }

    Stop-Ports -Ports $FrontendPorts -Label 'Frontend'
    Start-FrontendProcess

    if (-not (Wait-ForUrl -Url $FrontendHealthUrl)) {
        throw "Frontend: no respondió correctamente en $FrontendHealthUrl"
    }

    Write-Host "Frontend: listo en $FrontendHealthUrl" -ForegroundColor Green
}

function Show-Status {
    $portInfo = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in ($FrontendPorts + $BackendPort) } |
        Select-Object LocalPort, OwningProcess |
        Sort-Object LocalPort

    Write-Host "Estado de puertos:" -ForegroundColor Cyan
    if ($portInfo) {
        $portInfo | Format-Table -AutoSize
    }
    else {
        Write-Host "No hay procesos escuchando en 3000, 3001 o 5000" -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "URLs:" -ForegroundColor Cyan
    Write-Host "  Backend  ($BackendHealthUrl):  $(if (Test-UrlHealthy -Url $BackendHealthUrl) { 'OK' } else { 'DOWN' })"
    Write-Host "  Frontend ($FrontendHealthUrl): $(if (Test-UrlHealthy -Url $FrontendHealthUrl) { 'OK' } else { 'DOWN' })"
}

if ($Help) {
    Show-Help
    exit 0
}

if (-not (Test-CommandAvailable -CommandName 'node')) {
    Write-Host "Node.js no esta instalado o no esta en el PATH" -ForegroundColor Red
    exit 1
}

if ($Status) {
    Show-Status
    exit 0
}

if ($Stop) {
    Stop-Ports -Ports @($BackendPort) -Label 'Backend'
    Stop-Ports -Ports $FrontendPorts -Label 'Frontend'
    Show-Status
    exit 0
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "IN OUT MANAGER - ARRANQUE ESTABLE" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

try {
    if (-not $OnlyFrontend) {
        Ensure-Backend
    }

    if (-not $OnlyBackend) {
        Ensure-Frontend
    }

    Write-Host ""
    Write-Host "Servicios listos:" -ForegroundColor Green
    if (-not $OnlyFrontend) {
        Write-Host "  Backend:  $BackendHealthUrl" -ForegroundColor Cyan
    }
    if (-not $OnlyBackend) {
        Write-Host "  Frontend: $FrontendHealthUrl" -ForegroundColor Cyan
    }

    $serviceJobNames = @()
    if (-not $OnlyFrontend) {
        $serviceJobNames += 'inoutmanager-backend'
    }
    if (-not $OnlyBackend) {
        $serviceJobNames += 'inoutmanager-frontend'
    }

    if ($serviceJobNames.Count -gt 0) {
        Write-Host "" 
        Write-Host "Servicios ejecutándose en la terminal integrada. Presiona Ctrl+C para detener este arranque." -ForegroundColor Yellow

        while ($true) {
            foreach ($jobName in $serviceJobNames) {
                $job = Get-Job -Name $jobName -ErrorAction SilentlyContinue

                if ($job) {
                    Receive-Job -Job $job -Keep -ErrorAction SilentlyContinue | Out-Host
                }
            }

            $inactiveJobs = @(
                $serviceJobNames | Where-Object {
                    $job = Get-Job -Name $_ -ErrorAction SilentlyContinue
                    -not $job -or $job.State -ne 'Running'
                }
            )

            if ($inactiveJobs.Count -gt 0) {
                throw "Servicios detenidos inesperadamente: $($inactiveJobs -join ', ')"
            }

            Start-Sleep -Seconds 1
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}