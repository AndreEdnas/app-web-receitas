Set WshShell = CreateObject("WScript.Shell")

' Iniciar túnel oculto
WshShell.Run """C:\EDNAS\app-receitas\bats\iniciar_tunnel_receitas.bat""", 0, False

' Pequeno delay para garantir que o túnel arranca primeiro (opcional)
WScript.Sleep 2000

' Iniciar server oculto
WshShell.Run """C:\EDNAS\app-receitas\bats\server_receitas.bat""", 0, False
