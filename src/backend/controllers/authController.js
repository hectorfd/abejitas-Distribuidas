// Auth controller - handles authentication logic

const userModel = require('../models/usuarioModel');
const { getBranchCode } = require('../utils/idGenerator');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await userModel.findByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await userModel.verifyPassword(password, user.Password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const branchCode = getBranchCode();

    if (user.SucursalPermitida !== branchCode) {
      return res.status(403).json({
        error: `User belongs to ${user.SucursalPermitida}, this PC is configured for ${branchCode}`
      });
    }

    const userData = {
      id: user.UsuarioID,
      username: user.NombreUsuario,
      fullName: user.NombreCompleto,
      role: user.Rol,
      branch: user.SucursalPermitida
    };

    req.session = req.session || {};
    req.session.user = userData;

    res.json({
      success: true,
      user: userData
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function logout(req, res) {
  try {
    req.session = null;
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getCurrentUser(req, res) {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({ user: req.session.user });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  login,
  logout,
  getCurrentUser
};
