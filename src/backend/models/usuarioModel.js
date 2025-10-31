// User model - database operations for users

const db = require('../../../database/connection');
const bcrypt = require('bcryptjs');

async function findByUsername(username) {
  const query = 'SELECT * FROM Usuarios WHERE NombreUsuario = @username AND Activo = 1';
  const result = await db.query(query, { username });
  return result[0] || null;
}

async function findById(id) {
  const query = 'SELECT * FROM Usuarios WHERE UsuarioID = @id AND Activo = 1';
  const result = await db.query(query, { id });
  return result[0] || null;
}

async function create(userData) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const query = `
    INSERT INTO Usuarios (NombreUsuario, Password, NombreCompleto, Rol, SucursalPermitida)
    OUTPUT INSERTED.*
    VALUES (@username, @password, @fullName, @role, @branch)
  `;

  const params = {
    username: userData.username,
    password: hashedPassword,
    fullName: userData.fullName,
    role: userData.role,
    branch: userData.branch
  };

  const result = await db.query(query, params);
  return result[0];
}

async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

async function getAll() {
  const query = 'SELECT UsuarioID, NombreUsuario, NombreCompleto, Rol, SucursalPermitida, Activo FROM Usuarios';
  return await db.query(query);
}

module.exports = {
  findByUsername,
  findById,
  create,
  verifyPassword,
  getAll
};
