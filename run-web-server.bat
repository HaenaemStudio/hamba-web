@echo off
chcp 65001 > nul
title 함바여지도 Vite 개발 서버 (http://localhost:3000)
echo =======================================================
echo   함바여지도 Vite 초고속 개발 서버를 실행합니다...
echo   카카오 지도 허용 주소: http://localhost:3000
echo =======================================================
echo.

:: 3000번 포트 기존 프로세스 정리
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a > nul 2>&1

start http://localhost:3000
call npm run dev
pause
