$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TasksDir = $ScriptDir
$MappingFile = Join-Path $ScriptDir "RENAME_MAPPING.csv"
$BackupDir = Join-Path $ScriptDir "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "Starting Rename Script..."

# Backup
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
Get-ChildItem -Path $TasksDir -Filter "TASK-*.md" | Copy-Item -Destination $BackupDir -Force
Write-Host "Backup created at $BackupDir"

# Load Mapping
if (-not (Test-Path $MappingFile)) {
    Write-Error "Mapping file not found at $MappingFile"
    exit 1
}
$mapping = Import-Csv -Path $MappingFile

# Rename
$count = 0
foreach ($item in $mapping) {
    if ($item.OldFileName -like "TASK-*.md") {
        $oldPath = Join-Path $TasksDir $item.OldFileName
        if (Test-Path $oldPath) {
            try {
                Rename-Item -Path $oldPath -NewName $item.NewFileName -Force
                $count++
                Write-Host "Renamed: $($item.OldFileName) -> $($item.NewFileName)"
            }
            catch {
                Write-Host "Failed to rename $($item.OldFileName): $_"
            }
        }
    }
}

Write-Host "Completed. Renamed $count files."
