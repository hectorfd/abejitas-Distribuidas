n# Configuración de Red para Sistema Distribuido de distribuida

## Configuración del Servidor Central (Lima - PC)

### 1. Habilitar Puerto 3000 en Firewall de Windows

Abre **PowerShell como Administrador** y ejecuta:

```powershell
# Permitir conexiones entrantes en puerto 3000
New-NetFirewallRule -DisplayName "Abejitas Central - Puerto 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Verificar que la regla se creó
Get-NetFirewallRule -DisplayName "Abejitas Central - Puerto 3000"
```

### 2. Verificar tu IP Local

```powershell
ipconfig | findstr "IPv4"
```

Tu IP actual: `192.168.1.5`

### 3. Verificar que el servidor está escuchando

Después de iniciar la aplicación, verifica:

```powershell
netstat -ano | findstr :3000
```

Deberías ver algo como: `0.0.0.0:3000` o `[::]::3000`

---

## Configuración de Sucursal (Cusco - Laptop)

### 1. Habilitar Puerto 3000 en Firewall (Laptop)

Abre **PowerShell como Administrador** en el laptop y ejecuta:

```powershell
# Permitir conexiones entrantes en puerto 3000
New-NetFirewallRule -DisplayName "Abejitas Sucursal - Puerto 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Permitir conexiones salientes hacia el servidor central
New-NetFirewallRule -DisplayName "Abejitas Sucursal - Salida Central" -Direction Outbound -RemoteAddress 192.168.1.5 -RemotePort 3000 -Protocol TCP -Action Allow
```

### 2. Editar config.json en el Laptop

Ruta: `config/config.json`

```json
{
  "tipo": "SUCURSAL",
  "sucursal_instalacion": "CUS",
  "nombre_sucursal": "Cusco",

  "base_datos": {
    "servidor": "NOMBRE_SERVIDOR_LAPTOP",
    "bd": "Abejitas_Cusco",
    "usuario": "sa",
    "password": "12345678",
    "puerto": 1433,
    "opciones": {
      "encrypt": false,
      "trustServerCertificate": true
    }
  },

  "servidor_app": {
    "puerto": 3000,
    "host": "0.0.0.0"
  },

  "servidor_central": {
    "host": "192.168.1.5",
    "puerto": 3000,
    "habilitado": true
  },

  "sincronizacion": {
    "automatica": false,
    "hora": null,
    "intervalo_minutos": null
  },

  "negocio": {
    "nombre_empresa": "Abarrotes Las Abejitas - Cusco",
    "ruc": "20123456789",
    "direccion": "Cusco, Perú",
    "telefono": "084-123456"
  }
}
```

### 3. Crear Base de Datos en el Laptop

Ejecuta el script: `database/schema/setup-cusco.sql`

```powershell
# En SQL Server Management Studio o desde cmd
sqlcmd -S NOMBRE_SERVIDOR_LAPTOP -U sa -P 12345678 -i "database/schema/setup-cusco.sql"
```

---

## Pruebas de Conectividad

### Desde el Laptop (Cusco) probar conexión a Lima:

```powershell
# Probar si el puerto está abierto
Test-NetConnection -ComputerName 192.168.1.5 -Port 3000

# O con telnet (si está habilitado)
telnet 192.168.1.5 3000
```

Si `TcpTestSucceeded: True`, la conexión funciona ✅

### Desde Lima (PC) probar si el puerto está escuchando:

```powershell
# Ver si el servidor está escuchando en 3000
netstat -ano | findstr :3000
```

---

## Troubleshooting

### El laptop no puede conectarse a Lima:

1. **Verificar que ambas están en la misma red WiFi**
2. **Ping desde laptop a PC:**
   ```powershell
   ping 192.168.1.5
   ```
3. **Verificar firewall del router** - Algunos routers bloquean comunicación entre dispositivos
4. **Desactivar temporalmente firewall de Windows para probar:**
   ```powershell
   # Solo para prueba, luego vuelve a activarlo
   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
   ```

### Si cambia la IP de Lima:

1. Ejecuta en Lima:
   ```powershell
   ipconfig | findstr "IPv4"
   ```
2. Actualiza en laptop el archivo `config/config.json`:
   ```json
   "servidor_central": {
     "host": "NUEVA_IP_AQUI",
     ...
   }
   ```

---

## Comandos Útiles

### Ver reglas de firewall activas:
```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Abejitas*"}
```

### Eliminar regla de firewall:
```powershell
Remove-NetFirewallRule -DisplayName "Abejitas Central - Puerto 3000"
```

### Ver qué aplicación está usando el puerto 3000:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```

---


