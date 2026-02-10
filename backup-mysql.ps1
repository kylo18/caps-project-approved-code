$volumeName = "caps-project-approved-code_mysql_data"
$backupFile = "mysql_data_backup.tar.gz"

docker run --rm `
  -v ${volumeName}:/volume `
  -v ${PWD}:/backup `
  alpine `
  tar czf /backup/$backupFile -C /volume .

Write-Host "Backup saved as $backupFile from volume: $volumeName"