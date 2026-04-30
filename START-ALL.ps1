Start-Process powershell -ArgumentList "-NoExit", "-Command", "& 'C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe' --dbpath 'C:\data\db'"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Administrator\Desktop\yawhub\yawhubby'; .\kill-port.ps1; npm run dev"
Start-Sleep -Seconds 65
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Administrator\Desktop\yawhub\yawhub'; npm run dev"
