; Included explicitly in both electron-builder NSIS compile passes.
!ifdef BUILD_UNINSTALLER
  ; Avoid the uninstall CRC failure reported with cross-platform builds.
  ; The downloadable setup retains its normal integrity check.
  CRCCheck off
!else
  !ifdef UNINSTALLER_OUT_FILE
    ; Preserve the generated uninstaller before electron-builder removes it.
    ; Signing, when configured, has already completed. Fail if copying fails.
    ; %1 is the final setup filename, including its output directory.
    !ifdef NSIS_WIN32_MAKENSIS
      !finalize 'copy /B /Y "${UNINSTALLER_OUT_FILE}" "%1.uninstaller.exe" >NUL' = 0
    !else
      !finalize 'cp "${UNINSTALLER_OUT_FILE}" "%1.uninstaller.exe"' = 0
    !endif
  !endif
!endif

!macro customUnInit
  ; initMultiUser has already resolved the registered installation directory.
  ; Refuse to uninstall from a download folder without a matching application.
  ReadRegStr $R9 SHCTX "${INSTALL_REGISTRY_KEY}" "InstallLocation"
  StrCmp $R9 "" labelforge_uninstall_missing
  StrCmp $R9 $INSTDIR 0 labelforge_uninstall_missing
  IfFileExists "$INSTDIR\${APP_EXECUTABLE_FILENAME}" labelforge_uninstall_found
  labelforge_uninstall_missing:
  IfSilent labelforge_uninstall_abort
  MessageBox MB_OK|MB_ICONEXCLAMATION "Label Studio was not found in the installation folder. Run this uninstaller as the Windows user who installed Label Studio."
  labelforge_uninstall_abort:
    SetErrorLevel 1
    Quit
  labelforge_uninstall_found:
!macroend
