# Script to split plan.md into individual task files

$planFile = "plan.md"
$tasksDir = "tasks"

# Ensure tasks directory exists
if (-not (Test-Path $tasksDir)) {
    New-Item -ItemType Directory -Path $tasksDir | Out-Null
}

# Read the plan file line by line
$lines = Get-Content -Path $planFile

$currentTask = $null
$taskContent = @()
$taskCount = 0

foreach ($line in $lines) {
    # Check if this is a task header
    if ($line -match '^### [✅💡] TASK\s+([\d.]+):\s+(.+)$') {
        # Save previous task if exists
        if ($currentTask) {
            $taskNumber = $currentTask.Number
            $taskTitle = $currentTask.Title
            $taskHeader = $currentTask.Header
            $taskIcon = $currentTask.Icon
            
            # Create safe filename
            $safeTitle = $taskTitle `
                -replace '[^\w\s-]', '' `
                -replace '\s+', '-' `
                -replace '-+', '-' `
                -replace '^-+', '' `
                -replace '-+$', ''
            
            # Pad number for sorting
            $paddedNumber = $taskNumber.PadLeft(5, '0')
            $fileName = "TASK-$paddedNumber-$safeTitle.md"
            $filePath = Join-Path $tasksDir $fileName
            
            # Join content and clean up
            $content = ($taskContent -join "`n").Trim()
            $content = $content -replace '---\s*$', ''
            $content = $content.Trim()
            
            # Determine priority
            $priority = if ($taskIcon -eq '✅') { 'Core' } else { 'Optional' }
            
            # Add metadata header
            $fileContent = @"
# $taskHeader

> **Task Number:** $taskNumber  
> **Priority:** $priority  
> **Status:** ⬜ Not Started

---

$content

---

## 📝 Implementation Notes

**Pre-requisites:**
- [ ] Review task requirements carefully
- [ ] Check dependencies on other tasks
- [ ] Setup development environment

**Implementation Checklist:**
- [ ] Complete all steps listed above
- [ ] Write unit tests
- [ ] Write integration tests (if applicable)
- [ ] Update API documentation (Swagger)
- [ ] Code review
- [ ] Test manually

**Post-completion:**
- [ ] Update task status to ✅ Done
- [ ] Document any issues or learnings
- [ ] Commit and push changes

**Time Tracking:**
- Estimated: ___ hours
- Actual: ___ hours
"@
            
            Set-Content -Path $filePath -Value $fileContent -Encoding UTF8
            $taskCount++
            Write-Host "[$taskCount] Created: $fileName"
        }
        
        # Start new task
        $currentTask = @{
            Number = $Matches[1]
            Title = $Matches[2].Trim()
            Header = $line
            Icon = if ($line -match '✅') { '✅' } else { '💡' }
        }
        $taskContent = @()
    }
    elseif ($line -match '^## [^P]' -or $line -match '^## PHASE' -or $line -match '^# ') {
        # This is a major section, save current task if exists
        if ($currentTask) {
            $taskNumber = $currentTask.Number
            $taskTitle = $currentTask.Title
            $taskHeader = $currentTask.Header
            $taskIcon = $currentTask.Icon
            
            # Create safe filename
            $safeTitle = $taskTitle `
                -replace '[^\w\s-]', '' `
                -replace '\s+', '-' `
                -replace '-+', '-' `
                -replace '^-+', '' `
                -replace '-+$', ''
            
            # Pad number for sorting
            $paddedNumber = $taskNumber.PadLeft(5, '0')
            $fileName = "TASK-$paddedNumber-$safeTitle.md"
            $filePath = Join-Path $tasksDir $fileName
            
            # Join content and clean up
            $content = ($taskContent -join "`n").Trim()
            $content = $content -replace '---\s*$', ''
            $content = $content.Trim()
            
            # Determine priority
            $priority = if ($taskIcon -eq '✅') { 'Core' } else { 'Optional' }
            
            # Add metadata header
            $fileContent = @"
# $taskHeader

> **Task Number:** $taskNumber  
> **Priority:** $priority  
> **Status:** ⬜ Not Started

---

$content

---

## 📝 Implementation Notes

**Pre-requisites:**
- [ ] Review task requirements carefully
- [ ] Check dependencies on other tasks
- [ ] Setup development environment

**Implementation Checklist:**
- [ ] Complete all steps listed above
- [ ] Write unit tests
- [ ] Write integration tests (if applicable)
- [ ] Update API documentation (Swagger)
- [ ] Code review
- [ ] Test manually

**Post-completion:**
- [ ] Update task status to ✅ Done
- [ ] Document any issues or learnings
- [ ] Commit and push changes

**Time Tracking:**
- Estimated: ___ hours
- Actual: ___ hours
"@
            
            Set-Content -Path $filePath -Value $fileContent -Encoding UTF8
            $taskCount++
            Write-Host "[$taskCount] Created: $fileName"
            
            # Reset for next task
            $currentTask = $null
            $taskContent = @()
        }
    }
    elseif ($currentTask) {
        # Add line to current task content
        $taskContent += $line
    }
}

# Save last task if exists
if ($currentTask) {
    $taskNumber = $currentTask.Number
    $taskTitle = $currentTask.Title
    $taskHeader = $currentTask.Header
    $taskIcon = $currentTask.Icon
    
    # Create safe filename
    $safeTitle = $taskTitle `
        -replace '[^\w\s-]', '' `
        -replace '\s+', '-' `
        -replace '-+', '-' `
        -replace '^-+', '' `
        -replace '-+$', ''
    
    # Pad number for sorting
    $paddedNumber = $taskNumber.PadLeft(5, '0')
    $fileName = "TASK-$paddedNumber-$safeTitle.md"
    $filePath = Join-Path $tasksDir $fileName
    
    # Join content and clean up
    $content = ($taskContent -join "`n").Trim()
    $content = $content -replace '---\s*$', ''
    $content = $content.Trim()
    
    # Determine priority
    $priority = if ($taskIcon -eq '✅') { 'Core' } else { 'Optional' }
    
    # Add metadata header
    $fileContent = @"
# $taskHeader

> **Task Number:** $taskNumber  
> **Priority:** $priority  
> **Status:** ⬜ Not Started

---

$content

---

## 📝 Implementation Notes

**Pre-requisites:**
- [ ] Review task requirements carefully
- [ ] Check dependencies on other tasks
- [ ] Setup development environment

**Implementation Checklist:**
- [ ] Complete all steps listed above
- [ ] Write unit tests
- [ ] Write integration tests (if applicable)
- [ ] Update API documentation (Swagger)
- [ ] Code review
- [ ] Test manually

**Post-completion:**
- [ ] Update task status to ✅ Done
- [ ] Document any issues or learnings
- [ ] Commit and push changes

**Time Tracking:**
- Estimated: ___ hours
- Actual: ___ hours
"@
    
    Set-Content -Path $filePath -Value $fileContent -Encoding UTF8
    $taskCount++
    Write-Host "[$taskCount] Created: $fileName"
}

Write-Host "`n✅ Done! Created $taskCount task files in '$tasksDir' directory."
Write-Host "`nTask files are organized as:"
Write-Host "  📁 tasks/"
Write-Host "    ├── TASK-00001-*.md (Task 01)"
Write-Host "    ├── TASK-00002-*.md (Task 02)"
Write-Host "    ├── ..."
Write-Host "    ├── TASK-004.5-*.md (Task 4.5)"
Write-Host "    ├── TASK-0011.5-*.md (Task 11.5)"
Write-Host "    ├── TASK-0023.5-*.md (Task 23.5)"
Write-Host "    └── TASK-00073-*.md (Task 73)"
Write-Host "`n💡 Files are padded with zeros for proper sorting."
