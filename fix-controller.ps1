Remove-Item "src\modules\users\users.controller.ts" -Force
Rename-Item "src\modules\users\users.controller.clean.ts" "users.controller.ts"
Write-Host "Controller fixed successfully!"
