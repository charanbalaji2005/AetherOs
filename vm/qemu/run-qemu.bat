@echo off
REM vm/qemu/run-qemu.bat
REM Launch AetherOS Live ISO preview in QEMU on Windows
setlocal

set "QEMU_EXE=qemu-system-x86_64"
if exist "C:\Program Files\qemu\qemu-system-x86_64.exe" (
    set "QEMU_EXE=C:\Program Files\qemu\qemu-system-x86_64.exe"
)

set "ISO=build\output\AetherOS-1.0-x86_64.iso"
set "QCOW2=build\output\AetherOS-1.0-x86_64.qcow2"

echo ========================================================
echo         Launching AetherOS Live Preview in QEMU         
echo ========================================================

if exist "%ISO%" (
    echo Booting Live ISO: %ISO%
    "%QEMU_EXE%" -accel whpx -accel tcg -m 4096 -smp 4 -vga virtio -display default,show-cursor=on -cdrom "%ISO%" -boot d
) else if exist "%QCOW2%" (
    echo Booting from QCOW2 virtual disk: %QCOW2%
    "%QEMU_EXE%" -accel whpx -accel tcg -m 4096 -smp 4 -vga virtio -display default,show-cursor=on -drive file="%QCOW2%",format=qcow2,if=virtio
) else (
    echo Error: No ISO found in build\output\
)

pause
