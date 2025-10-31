# Configuración

Este directorio contiene los archivos de configuración para cada instalación del sistema.

## Archivos de plantilla

- `config.lima.json` - Configuración para Lima Central (servidor principal)
- `config.cusco.json` - Configuración para Sucursal Cusco
- `config.abancay.json` - Configuración para Sucursal Abancay

## Configuración inicial

Cuando instales el sistema en cada PC, copia el archivo correspondiente a `config.json`:

```bash
# En Lima Central:
cp config/config.lima.json config/config.json

# En Cusco:
cp config/config.cusco.json config/config.json

# En Abancay:
cp config/config.abancay.json config/config.json
```

Luego edita `config.json` y actualiza:
- La contraseña de SQL Server (`base_datos.password`)
- La IP del servidor central Lima (`servidor_central.host`)
- Otros datos según tu configuración

## Importante

⚠️ **NO subas `config.json` al repositorio** - Este archivo contiene credenciales y configuración local.

El archivo `config.json` está en `.gitignore` para evitar commits accidentales.
