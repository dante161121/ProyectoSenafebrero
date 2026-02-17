
# IN OUT MANAGER - SCRIPT DE INICIO COMPLETO (me toco crearlo debido a los problemas de arranque

# Este script inicia tanto el backend como el frontend simultáneamente

param(
    [switch]$OnlyBackend,
    [switch]$OnlyFrontend,
    [switch]$Help
)

function Show-Help {
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "IN OUT MANAGER - SCRIPT DE INICIO" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Green
    Write-Host "  .\start-both.ps1              # Inicia backend y frontend"
    Write-Host "  .\start-both.ps1 -OnlyBackend # Solo backend"
    Write-Host "  .\start-both.ps1 -OnlyFrontend# Solo frontend"
    Write-Host "  .\start-both.ps1 -Help        # Muestra esta ayuda"
    Write-Host ""
    Write-Host "Puertos:" -ForegroundColor Green
    Write-Host "  Backend:  http://localhost:5000"
    Write-Host "  Frontend: http://localhost:3000"
    Write-Host ""
}

function Test-NodeJs {
    try {
        $nodeVersion = node --version
        Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " Node.js no está instalado o no está en el PATH" -ForegroundColor Red
        return $false
    }
}

function Test-MongoDB {
    Write-Host "Verificando conexión a MongoDB..." -ForegroundColor Yellow
    try {
        # Test simple de conexión
        $mongoTest = Start-Process -FilePath "node" -ArgumentList "-e", "require('mongoose').connect('mongodb://localhost:27017/inoutmanager').then(() => {console.log('MongoDB OK'); process.exit(0)}).catch(() => process.exit(1))" -Wait -PassThru -NoNewWindow
        if ($mongoTest.ExitCode -eq 0) {
            Write-Host " MongoDB está disponible" -ForegroundColor Green
            return $true
        } else {
            Write-Host " MongoDB podría no estar disponible" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "No se pudo verificar MongoDB" -ForegroundColor Yellow
        return $false
    }
}

function Start-Backend {
    Write-Host "Iniciando Backend..." -ForegroundColor Yellow
    $backendPath = "$PSScriptRoot\backend"
    
    if (-not (Test-Path $backendPath)) {
        Write-Host "No se encontró el directorio del backend: $backendPath" -ForegroundColor Red
        return $null
    }
    
    if (-not (Test-Path "$backendPath\server.js")) {
        Write-Host "No se encontró server.js en: $backendPath" -ForegroundColor Red
        return $null
    }
    
    try {
        $backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location '$backendPath'; Write-Host '🚀 Backend iniciado' -ForegroundColor Green; node server.js" -PassThru
        Write-Host "Backend iniciado (PID: $($backendProcess.Id))" -ForegroundColor Green
        Write-Host "   URL: http://localhost:5000" -ForegroundColor Cyan
        return $backendProcess
    }
    catch {
        Write-Host " Error al iniciar el backend: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Start-Frontend {
    Write-Host " Iniciando Frontend..." -ForegroundColor Yellow
    $frontendPath = "$PSScriptRoot\frontend"
    
    if (-not (Test-Path $frontendPath)) {
        Write-Host " No se encontró el directorio del frontend: $frontendPath" -ForegroundColor Red
        return $null
    }
    
    try {
        $frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", "Set-Location '$PSScriptRoot'; Write-Host '🚀 Frontend iniciado en puerto 5173' -ForegroundColor Green; npm run dev" -PassThru
        Write-Host " Frontend iniciado (PID: $($frontendProcess.Id))" -ForegroundColor Green
        Write-Host "   URL: http://localhost:5173" -ForegroundColor Cyan
        return $frontendProcess
    }
    catch {
        Write-Host " Error al iniciar el frontend: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Stop-Services {
    param($BackendProcess, $FrontendProcess)
    
    Write-Host ""
    Write-Host "Deteniendo servicios..." -ForegroundColor Yellow
    
    if ($BackendProcess -and -not $BackendProcess.HasExited) {
        try {
            Stop-Process -Id $BackendProcess.Id -Force
            Write-Host " Backend detenido" -ForegroundColor Green
        }
        catch {
            Write-Host " Error al detener backend" -ForegroundColor Yellow
        }
    }
    
    if ($FrontendProcess -and -not $FrontendProcess.HasExited) {
        try {
            Stop-Process -Id $FrontendProcess.Id -Force
            Write-Host " Frontend detenido" -ForegroundColor Green
        }
        catch {
            Write-Host " Error al detener frontend" -ForegroundColor Yellow
        }
    }
    
    # Limpiar procesos node restantes
    try {
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    catch {
        # Ignorar errores
    }
}


# SCRIPT PRINCIPAL


if ($Help) {
    Show-Help
    exit 0
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "IN OUT MANAGER - INICIANDO SERVICIOS" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
if (-not (Test-NodeJs)) {
    Write-Host "Por favor instale Node.js desde https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verificar MongoDB
Test-MongoDB | Out-Null

$backendProcess = $null
$frontendProcess = $null

try {
    # Iniciar servicios según parámetros
    if (-not $OnlyFrontend) {
        $backendProcess = Start-Backend
        if (-not $backendProcess) {
            Write-Host " No se pudo iniciar el backend" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 3  # Esperar a que el backend se inicie
    }
    
    if (-not $OnlyBackend) {
        $frontendProcess = Start-Frontend
        if (-not $frontendProcess) {
            Write-Host " No se pudo iniciar el frontend" -ForegroundColor Red
            if ($backendProcess) {
                Stop-Process -Id $backendProcess.Id -Force
            }
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "¡SERVICIOS INICIADOS EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    
    if ($backendProcess) {
        Write-Host "🔧 Backend:  http://localhost:5000" -ForegroundColor Cyan
    }
    if ($frontendProcess) {
        Write-Host " Frontend: http://localhost:3000" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "Presione Ctrl+C para detener todos los servicios" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Cyan
    
    # Esperar hasta que el usuario presione Ctrl+C
    try {
        while ($true) {
            Start-Sleep -Seconds 1
            
            # Verificar si los procesos siguen activos
            if ($backendProcess -and $backendProcess.HasExited) {
                Write-Host " El backend se ha detenido inesperadamente" -ForegroundColor Yellow
                break
            }
            if ($frontendProcess -and $frontendProcess.HasExited) {
                Write-Host "El frontend se ha detenido inesperadamente" -ForegroundColor Yellow
                break
            }
        }
    }
    catch [System.Management.Automation.PipelineStoppedException] {
        # Ctrl+C presionado
        Write-Host ""
        Write-Host "Interrupción detectada..." -ForegroundColor Yellow
    }
}
finally {
    Stop-Services -BackendProcess $backendProcess -FrontendProcess $frontendProcess
    Write-Host ""
    Write-Host "¡Hasta luego!" -ForegroundColor Green
}