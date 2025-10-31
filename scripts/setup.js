// Interactive setup script for branch configuration

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const branches = {
  '1': { code: 'CUS', name: 'Cusco', db: 'Sucursal_Cusco', port: 3002 },
  '2': { code: 'ABA', name: 'Abancay', db: 'Sucursal_Abancay', port: 3001 },
  '3': { code: 'LIM', name: 'Lima Central', db: 'Central_Lima', port: 3000 }
};

async function setup() {
  console.log('\n========================================');
  console.log('  ABARROTES LAS ABEJITAS - SETUP');
  console.log('========================================\n');

  const choice = await question(
    'Select branch:\n' +
    '1. Cusco\n' +
    '2. Abancay\n' +
    '3. Lima Central\n' +
    'Option: '
  );

  const branch = branches[choice];

  if (!branch) {
    console.log('Invalid option');
    rl.close();
    return;
  }

  console.log(`\nConfiguring: ${branch.name}\n`);

  const sqlPassword = await question('SQL Server password (sa): ');

  let limaHost = null;
  if (branch.code !== 'LIM') {
    limaHost = await question('Lima Central IP (e.g. 192.168.1.10): ');
  }

  const config = {
    tipo: branch.code === 'LIM' ? 'CENTRAL' : 'SUCURSAL',
    sucursal_instalacion: branch.code,
    nombre_sucursal: branch.name,
    base_datos: {
      servidor: 'localhost',
      bd: branch.db,
      usuario: 'sa',
      password: sqlPassword,
      puerto: 1433,
      opciones: {
        encrypt: false,
        trustServerCertificate: true
      }
    },
    servidor_app: {
      puerto: branch.port,
      host: branch.code === 'LIM' ? '0.0.0.0' : 'localhost'
    },
    servidor_central: {
      host: limaHost,
      puerto: 3000,
      habilitado: branch.code !== 'LIM'
    },
    sincronizacion: {
      automatica: branch.code !== 'LIM',
      hora: branch.code !== 'LIM' ? '23:00' : null,
      intervalo_minutos: null
    },
    negocio: {
      nombre_empresa: `Abarrotes Las Abejitas${branch.code !== 'LIM' ? ' - Sucursal ' + branch.name : ''}`,
      ruc: '20123456789',
      direccion: `Av. Ejemplo, ${branch.name}, Peru`,
      telefono: '01-1234567'
    }
  };

  const configPath = path.join(__dirname, '../config/config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log('\n========================================');
  console.log('Configuration saved successfully!');
  console.log('========================================');
  console.log(`Branch: ${branch.name}`);
  console.log(`Code: ${branch.code}`);
  console.log(`Database: ${branch.db}`);
  console.log(`Port: ${branch.port}`);
  console.log('\nNext steps:');
  console.log('1. Create database: Execute SQL scripts in database/schema/');
  console.log('2. Test connection: npm run db:test');
  console.log('3. Start application: npm run dev');
  console.log('');

  rl.close();
}

setup().catch(err => {
  console.error('Setup error:', err);
  rl.close();
  process.exit(1);
});
