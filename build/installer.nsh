; LabelForge Studio - Windows installer customizations.
; electron-builder picks this file up automatically (build/installer.nsh)
; and includes it in both the installer and the uninstaller compile pass.
;
; --- Fix: "Installer integrity check has failed" on uninstall ---
; When the Windows setup is built on macOS, electron-builder generates the
; uninstaller by compiling a small NSIS stub and then extracting the real
; uninstaller EXE out of it with a pure-JS reader (UninstallerReader). The
; reconstructed EXE trips NSIS's own CRC self-check on real Windows even
; though the uninstaller data itself is intact, so every launch of
; "Uninstall Label Studio.exe" aborts with the integrity error. (The same
; thing happens any time the uninstaller is touched after makensis runs:
; code signing, rcedit, or manifest stamping all invalidate the CRC.)
;
; Compiling the CRC self-check out of the *uninstaller only* fixes it.
; BUILD_UNINSTALLER is defined by electron-builder for the uninstaller
; compile pass, so the downloadable setup EXE keeps its integrity check
; (it still catches corrupt/incomplete downloads) while the locally
; generated uninstaller no longer fails its self-check at startup.
!ifdef BUILD_UNINSTALLER
  CRCCheck off
!endif
