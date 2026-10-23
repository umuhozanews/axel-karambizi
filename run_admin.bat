@echo off
title Axel Karambizi Portfolio Admin Server - Gacondo Labs
echo ======================================================
echo  Axel Karambizi Portfolio - Admin CMS Panel
echo  Created by Gacondo Labs
echo ======================================================
echo.
echo Starting local admin server on http://localhost:8000/admin/ ...
echo.
python admin\server.py --admin
pause
