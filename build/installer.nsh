; BATSS Studio was called Albatross before 6.0. The rename changed the app
; ID, and with it the GUID the installer keys its registry entries on, so
; installing BATSS Studio doesn't find Albatross to replace it and both
; stay installed. Once BATSS Studio is installed, this runs Albatross's own
; uninstaller, keeping its app data, the same way electron-builder removes
; an older version of the same app (uninstallOldVersion in installUtil.nsh).
;
; electron-builder derives the GUID from the app ID as a UUID v5 in its own
; namespace (NsisTarget.js: UUID.v5(appId, 50e065bc-3134-11e6-9bab-38c9862bdaf3)).
; This is the GUID of Albatross's app ID, com.albatross.app.
!define ALBATROSS_GUID "0d241759-7deb-509d-acc4-ae1942aecf7c"

; Albatross was only ever installed per user (no perMachine in its
; electron-builder.yml), so its entries are under HKCU
!macro customInstall
  Push $R7
  Push $R8
  Push $R9

  ClearErrors
  ReadRegStr $R7 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${ALBATROSS_GUID}" "UninstallString"
  ReadRegStr $R8 HKCU "Software\${ALBATROSS_GUID}" "InstallLocation"

  ${if} $R7 != ""
  ${andIf} $R8 != ""
    ; UninstallString is the quoted uninstaller path followed by flags
    !insertmacro GetInQuotes $R9 "$R7"

    ${if} ${FileExists} "$R9"
      DetailPrint "Removing Albatross, the earlier name of BATSS Studio"

      ; Run a copy: the uninstaller removes the folder it's in. With _?= it
      ; runs in place and ExecWait waits for it, instead of it relaunching
      ; itself from a temporary folder and returning straight away.
      ; --updated keeps the app data, as for an update.
      !insertmacro copyFile "$R9" "$PLUGINSDIR\albatross-uninstaller.exe"
      ExecWait '"$PLUGINSDIR\albatross-uninstaller.exe" /S /KEEP_APP_DATA /currentuser --updated _?=$R8'

      ; Run with _?=, the uninstaller leaves itself behind. Only the
      ; then-empty folder is removed (RMDir without /r).
      Delete "$R9"
      RMDir "$R8"
    ${endif}
  ${endif}
  ClearErrors

  Pop $R9
  Pop $R8
  Pop $R7
!macroend
