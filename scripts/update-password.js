const bcrypt = require('bcryptjs');
const db = require('../database/connection');

async function updateAdminPassword() {
  try {
    await db.connect();
    console.log('Connected to database');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('New hashed password:', hashedPassword);

    const query = `UPDATE Usuarios SET Password = @password WHERE NombreUsuario = 'admin'`;
    await db.query(query, { password: hashedPassword });

    console.log('Password updated successfully');
    console.log('You can now login with: admin / admin123');

    await db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAdminPassword();
