@echo off
start cmd /k "cd backend && python app.py"
timeout /t 5
start cmd /k "cd web && node server.js"
echo Services started! Access the application at http://localhost:3000
