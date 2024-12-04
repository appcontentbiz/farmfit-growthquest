@echo off
echo Setting up GrowthQuest Development Environment...

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Downloading Python installer...
    curl https://www.python.org/ftp/python/3.9.7/python-3.9.7-amd64.exe -o python-installer.exe
    echo Installing Python...
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    del python-installer.exe
)

:: Create and activate virtual environment
echo Creating virtual environment...
python -m venv venv
call venv\Scripts\activate

:: Install requirements
echo Installing requirements...
pip install -r requirements.txt

:: Initialize database
echo Initializing database...
python app.py

echo Setup complete! You can now run the application with:
echo python app.py
pause
