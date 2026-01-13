$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MappingFile = Join-Path $ScriptDir "RENAME_MAPPING.csv"
$IndexFile = Join-Path $ScriptDir "TASKS_PRIORITY_INDEX.md"

Write-Host "Updating Index Links..."

if (-not (Test-Path $MappingFile) -or -not (Test-Path $IndexFile)) {
    Write-Error "Missing required files."
    exit 1
}

$content = Get-Content -Path $IndexFile -Raw
$mapping = Import-Csv -Path $MappingFile

foreach ($item in $mapping) {
    if ($item.OldFileName -like "TASK-*.md") {
        # Replace filename in links
        $old = [Regex]::Escape($item.OldFileName)
        $new = $item.NewFileName
        $content = $content -replace $old, $new
    }
}

Set-Content -Path $IndexFile -Value $content
Write-Host "Index file updated successfully."
