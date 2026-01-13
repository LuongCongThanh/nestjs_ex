# Progress Checker for E-Commerce API Tasks

$tasksDir = "tasks"

# Get all task files
$allTasks = Get-ChildItem -Path $tasksDir -Filter "TASK-*.md" | Where-Object { $_.Name -ne "README.md" }
$totalTasks = $allTasks.Count

# Count completed tasks
$completedTasks = $allTasks | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match '>\s*\*\*Status:\*\*\s*✅\s*Done'
}
$completedCount = $completedTasks.Count

# Count in progress
$inProgressTasks = $allTasks | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match '>\s*\*\*Status:\*\*\s*🔄\s*In Progress'
}
$inProgressCount = $inProgressTasks.Count

# Count not started
$notStartedCount = $totalTasks - $completedCount - $inProgressCount

# Calculate percentage
$completedPercent = [math]::Round(($completedCount / $totalTasks) * 100, 1)
$inProgressPercent = [math]::Round(($inProgressCount / $totalTasks) * 100, 1)

# Progress bar
$barLength = 40
$completedBars = [math]::Floor(($completedCount / $totalTasks) * $barLength)
$inProgressBars = [math]::Floor(($inProgressCount / $totalTasks) * $barLength)
$remainingBars = $barLength - $completedBars - $inProgressBars

$progressBar = "[$('█' * $completedBars)$('▓' * $inProgressBars)$('░' * $remainingBars)]"

# Display results
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  📋 E-COMMERCE API - TASK PROGRESS REPORT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Overall Progress: $progressBar $completedPercent%" -ForegroundColor White
Write-Host ""
Write-Host "  📊 Statistics:" -ForegroundColor Yellow
Write-Host "     ✅ Completed:    " -NoNewline -ForegroundColor Green
Write-Host "$completedCount / $totalTasks tasks ($completedPercent%)" -ForegroundColor White
Write-Host "     🔄 In Progress:  " -NoNewline -ForegroundColor Yellow
Write-Host "$inProgressCount / $totalTasks tasks ($inProgressPercent%)" -ForegroundColor White
Write-Host "     ⬜ Not Started:  " -NoNewline -ForegroundColor Gray
Write-Host "$notStartedCount / $totalTasks tasks" -ForegroundColor White
Write-Host ""

# Show phase breakdown
$phases = @{
    "Phase 1: Setup & Infrastructure" = 1..5
    "Phase 2: Database Design" = 6..11
    "Phase 3-4: Auth & Users" = 12..18
    "Phase 5-6: Categories & Products" = 19..24
    "Phase 7-8: Carts & Orders" = 25..28
    "Phase 9-10: Common & Docs" = 29..35
    "Phase 11-17: Advanced Features" = 36..55
    "Phase 18: Essential Enhancements" = 56..65
    "Phase 19: Optional Advanced" = 66..73
}

Write-Host "  📑 Progress by Phase:" -ForegroundColor Yellow
Write-Host ""

foreach ($phase in $phases.GetEnumerator() | Sort-Object { $_.Value[0] }) {
    $phaseName = $phase.Key
    $phaseNumbers = $phase.Value
    
    # Count completed in this phase
    $phaseCompleted = 0
    $phaseTotal = 0
    
    foreach ($num in $phaseNumbers) {
        $pattern = "TASK-" + $num.ToString().PadLeft(5, '0') + "-*.md"
        $phaseTasks = Get-ChildItem -Path $tasksDir -Filter $pattern -ErrorAction SilentlyContinue
        
        foreach ($task in $phaseTasks) {
            $phaseTotal++
            $content = Get-Content $task.FullName -Raw
            if ($content -match '>\s*\*\*Status:\*\*\s*✅\s*Done') {
                $phaseCompleted++
            }
        }
    }
    
    # Handle special task numbers (4.5, 11.5, 23.5)
    if ($phaseNumbers -contains 5) {
        $specialTask = Get-ChildItem -Path $tasksDir -Filter "TASK-004.5-*.md" -ErrorAction SilentlyContinue
        if ($specialTask) {
            $phaseTotal++
            $content = Get-Content $specialTask.FullName -Raw
            if ($content -match '>\s*\*\*Status:\*\*\s*✅\s*Done') {
                $phaseCompleted++
            }
        }
    }
    
    if ($phaseNumbers -contains 11) {
        $specialTask = Get-ChildItem -Path $tasksDir -Filter "TASK-011.5-*.md" -ErrorAction SilentlyContinue
        if ($specialTask) {
            $phaseTotal++
            $content = Get-Content $specialTask.FullName -Raw
            if ($content -match '>\s*\*\*Status:\*\*\s*✅\s*Done') {
                $phaseCompleted++
            }
        }
    }
    
    if ($phaseNumbers -contains 24) {
        $specialTask = Get-ChildItem -Path $tasksDir -Filter "TASK-023.5-*.md" -ErrorAction SilentlyContinue
        if ($specialTask) {
            $phaseTotal++
            $content = Get-Content $specialTask.FullName -Raw
            if ($content -match '>\s*\*\*Status:\*\*\s*✅\s*Done') {
                $phaseCompleted++
            }
        }
    }
    
    if ($phaseTotal -gt 0) {
        $phasePercent = [math]::Round(($phaseCompleted / $phaseTotal) * 100, 0)
        $phaseBarLength = 20
        $phaseBars = [math]::Floor(($phaseCompleted / $phaseTotal) * $phaseBarLength)
        $phaseBar = "[$('█' * $phaseBars)$('░' * ($phaseBarLength - $phaseBars))]"
        
        $color = if ($phasePercent -eq 100) { "Green" } 
                 elseif ($phasePercent -gt 50) { "Yellow" } 
                 else { "Gray" }
        
        Write-Host ("     {0,-35} {1} {2,3}% ({3}/{4})" -f $phaseName, $phaseBar, $phasePercent, $phaseCompleted, $phaseTotal) -ForegroundColor $color
    }
}

Write-Host ""

# Show recently completed tasks
if ($completedCount -gt 0) {
    Write-Host "  ✨ Recently Completed Tasks:" -ForegroundColor Green
    Write-Host ""
    
    $recentCompleted = $completedTasks | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 5
    
    foreach ($task in $recentCompleted) {
        $taskName = $task.Name -replace '^TASK-\d+\.?\d*-', '' -replace '\.md$', '' -replace '-', ' '
        Write-Host "     • $taskName" -ForegroundColor White
    }
    Write-Host ""
}

# Show next tasks to work on
if ($notStartedCount -gt 0) {
    Write-Host "  📌 Next Tasks (Not Started):" -ForegroundColor Cyan
    Write-Host ""
    
    $nextTasks = $allTasks | Where-Object {
        $content = Get-Content $_.FullName -Raw
        $content -match '>\s*\*\*Status:\*\*\s*⬜\s*Not Started'
    } | Sort-Object Name | Select-Object -First 5
    
    foreach ($task in $nextTasks) {
        $taskName = $task.Name -replace '^TASK-\d+\.?\d*-', '' -replace '\.md$', '' -replace '-', ' '
        $taskNum = if ($task.Name -match 'TASK-(\d+\.?\d*)-') { $matches[1] } else { "?" }
        Write-Host "     • Task $taskNum`: $taskName" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Calculate estimated time remaining (if completed tasks have time tracking)
$totalEstimated = 0
$totalActual = 0
$tasksWithTime = 0

foreach ($task in $completedTasks) {
    $content = Get-Content $task.FullName -Raw
    
    if ($content -match 'Estimated:\s*(\d+)\s*hours') {
        $totalEstimated += [int]$matches[1]
    }
    
    if ($content -match 'Actual:\s*(\d+)\s*hours') {
        $totalActual += [int]$matches[1]
        $tasksWithTime++
    }
}

if ($tasksWithTime -gt 0) {
    $avgTimePerTask = [math]::Round($totalActual / $tasksWithTime, 1)
    $estimatedRemaining = [math]::Round($avgTimePerTask * $notStartedCount, 0)
    
    Write-Host "  ⏱️  Time Tracking:" -ForegroundColor Yellow
    Write-Host "     Average time per task: $avgTimePerTask hours" -ForegroundColor White
    Write-Host "     Estimated time remaining: $estimatedRemaining hours (~$([math]::Round($estimatedRemaining / 40, 1)) weeks)" -ForegroundColor White
    Write-Host ""
}

Write-Host "  💡 Tip: Update task status by editing the task file:" -ForegroundColor Gray
Write-Host "     > **Status:** ✅ Done" -ForegroundColor Gray
Write-Host "     > **Status:** 🔄 In Progress" -ForegroundColor Gray
Write-Host ""
