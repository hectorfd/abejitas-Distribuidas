# CONFIGURACIÓN DE RED - SISTEMA DISTRIBUIDO ABEJITAS

Guía paso a paso para configurar la red entre servidor central (Lima) y sucursales (Cusco, Abancay).

---

## REQUISITOS PREVIOS

- Ambas PCs en la misma red WiFi o conectadas al mismo hotspot móvil
- SQL Server instalado en ambas PCs
- Node.js instalado en ambas PCs
- Repositorio clonado en ambas PCs

---

## PASO 1: CONFIGURAR SERVIDOR CENTRAL (LIMA)

### 1.1 Obtener IP del Servidor Central

Abre **PowerShell** en la PC de Lima:

```powershell
ipconfig | findstr "IPv4"
```

**Anota la IP** (ejemplo: `192.168.1.10` o `172.20.10.2`)

### 1.2 Habilitar Puerto en Firewall

Abre **PowerShell como Administrador** en Lima:

```powershell
New-NetFirewallRule -DisplayName "Abejitas Central - Puerto 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 1.3 Copiar Configuración de Lima

```powershell
cd C:\ruta\al\proyecto\abejitas-Distribuidas
copy config\config.lima.json config\config.json
```

**Verificar** que `config\config.json` tenga:
```json
{
  "tipo": "CENTRAL",
  "servidor_app": {
    "puerto": 3000,
    "host": "0.0.0.0"
  }
}
```

### 1.4 Crear Base de Datos de Lima

En **SQL Server Management Studio** o **PowerShell**:

```powershell
sqlcmd -S localhost -U sa -P 12345678 -i "database\schema\setup-lima.sql"
```

### 1.5 Instalar Dependencias e Iniciar Servidor

```powershell
npm install
npm start
```

**Verificar** que aparezca:
```
========================================
  ABARROTES LAS ABEJITAS - SERVER
========================================
Branch: Lima Central
Code: LIM
Server: http://0.0.0.0:3000
Database: Abejitas_Lima
========================================
```

### 1.6 Comprobar que el Servidor Escucha

Abre otra ventana de **PowerShell**:

```powershell
netstat -ano | findstr :3000
```

Debe mostrar: `0.0.0.0:3000` o `[::]:3000`

---

## PASO 2: CONFIGURAR SUCURSAL (CUSCO)

### 2.1 Habilitar Puerto en Firewall

Abre **PowerShell como Administrador** en la PC de Cusco:

```powershell
New-NetFirewallRule -DisplayName "Abejitas Sucursal - Puerto 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

New-NetFirewallRule -DisplayName "Abejitas Sucursal - Salida" -Direction Outbound -Protocol TCP -Action Allow
```

### 2.2 Copiar y Editar Configuración de Cusco

```powershell
cd C:\ruta\al\proyecto\abejitas-Distribuidas
copy config\config.cusco.json config\config.json
```

**Editar** `config\config.json` y actualizar la IP del servidor central:

```json
{
  "tipo": "SUCURSAL",
  "sucursal_instalacion": "CUS",
  "nombre_sucursal": "Cusco",

  "servidor_central": {
    "host": "192.168.1.10",   ← CAMBIAR A LA IP DE LIMA DEL PASO 1.1
    "puerto": 3000,
    "habilitado": true
  }
}
```

### 2.3 Crear Base de Datos de Cusco

En **SQL Server Management Studio** o **PowerShell**:

```powershell
sqlcmd -S localhost -U sa -P 12345678 -i "database\schema\setup-cusco.sql"
```

### 2.4 Instalar Dependencias e Iniciar Sucursal

```powershell
npm install
npm start
```

**Verificar** que aparezca:
```
========================================
  ABARROTES LAS ABEJITAS - SERVER
========================================
Branch: Cusco
Code: CUS
Server: http://0.0.0.0:3000
Database: Abejitas_Cusco
========================================
```

---

## PASO 3: PROBAR CONECTIVIDAD

### 3.1 Desde Cusco: Ping a Lima

```powershell
ping 192.168.1.10
```

Debe responder correctamente

### 3.2 Desde Cusco: Probar Puerto 3000 de Lima

```powershell
Test-NetConnection -ComputerName 192.168.1.10 -Port 3000
```

Debe mostrar: `TcpTestSucceeded: True`

---

## PASO 4: PROBAR SINCRONIZACIÓN

### 4.1 En Cusco: Crear una Venta

1. Abre la aplicación de Cusco
2. Inicia sesión (usuario: `admin`, contraseña: `admin123`)
3. Crea una venta de prueba

### 4.2 En Cusco: Sincronizar con Lima

1. En el menú principal, selecciona **"Sincronizar"**
2. Espera el mensaje de confirmación

### 4.3 En Lima: Verificar Datos Recibidos

Abre **SQL Server Management Studio** y ejecuta:

```sql
USE Abejitas_Lima;

-- Ver ventas recibidas de Cusco
SELECT * FROM Ventas WHERE CodigoSucursal = 'CUS';

-- Ver log de sincronización
SELECT * FROM LogSincronizacion ORDER BY FechaHora DESC;
```

Si aparecen las ventas de Cusco: Sincronizacion exitosa

---

## CONFIGURACIÓN ADICIONAL: SINCRONIZACIÓN AUTOMÁTICA

### Habilitar Sincronización Nocturna (Opcional)

En Cusco, editar `config\config.json`:

```json
{
  "sincronizacion": {
    "automatica": true,
    "hora": "23:00",              ← Sincronizar a las 11 PM
    "intervalo_minutos": 30       ← También cada 30 minutos
  }
}
```

Reiniciar la aplicación para aplicar cambios.

---

## RESOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to server"

**Causa:** Firewall bloqueando conexión o IP incorrecta

**Solución:**
1. Verificar IP de Lima: `ipconfig | findstr "IPv4"`
2. Actualizar IP en `config.json` de Cusco
3. Verificar reglas de firewall:
   ```powershell
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Abejitas*"}
   ```

### Error: "Invalid column name 'Sincronizada'"

**Causa:** Base de datos creada con esquema antiguo

**Solución:**
```sql
-- Eliminar base de datos
DROP DATABASE Abejitas_Cusco;

-- Volver a ejecutar
sqlcmd -S localhost -U sa -P 12345678 -i "database\schema\setup-cusco.sql"
```

### Error: "Cannot find module 'node-fetch'"

**Causa:** Dependencias no instaladas

**Solución:**
```powershell
npm install
```

### Firewall bloquea comunicacion entre PCs

**Solución temporal (solo para pruebas):**
```powershell
# Desactivar firewall temporalmente
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# DESPUÉS DE PROBAR, volver a activarlo:
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

### IP de Lima cambio (DHCP)

**Solución:**

1. En Lima, obtener nueva IP:
   ```powershell
   ipconfig | findstr "IPv4"
   ```

2. En Cusco, actualizar `config\config.json`:
   ```json
   "servidor_central": {
     "host": "NUEVA_IP_AQUI"
   }
   ```

3. Reiniciar aplicación de Cusco

---

## COMANDOS ÚTILES

### Ver Procesos Escuchando en Puerto 3000
```powershell
netstat -ano | findstr :3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```

### Ver Reglas de Firewall de Abejitas
```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Abejitas*"}
```

### Eliminar Reglas de Firewall
```powershell
Remove-NetFirewallRule -DisplayName "Abejitas Central - Puerto 3000"
Remove-NetFirewallRule -DisplayName "Abejitas Sucursal - Puerto 3000"
```

### Verificar Conexión a SQL Server
```powershell
sqlcmd -S localhost -U sa -P 12345678 -Q "SELECT @@VERSION"
```

---

## RESUMEN DE CONFIGURACIÓN

| Componente | Lima (Central) | Cusco (Sucursal) |
|------------|----------------|------------------|
| **Tipo** | CENTRAL | SUCURSAL |
| **Base de datos** | Abejitas_Lima | Abejitas_Cusco |
| **Puerto app** | 3000 | 3000 |
| **Host app** | 0.0.0.0 | 0.0.0.0 |
| **Servidor central** | No aplica | IP de Lima:3000 |
| **Firewall** | Puerto 3000 Inbound | Puerto 3000 In/Out |
| **Archivo config** | config.lima.json | config.cusco.json |

---

**Proyecto desarrollado para el curso de Sistemas Distribuidos**
