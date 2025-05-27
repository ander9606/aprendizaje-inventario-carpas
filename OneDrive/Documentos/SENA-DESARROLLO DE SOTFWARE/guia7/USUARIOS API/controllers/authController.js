const users = require("../data/users");

// Registrar un nuevo usuario
const register = (req, res) => {
  const { username, password } = req.body;

  const userExists = users.find((user) => user.username === username);
  if (userExists) return res.status(400).json({ message: "Usuario ya existe" });

  users.push({ username, password });

  res.status(201).json({ message: "Registro exitoso" });
};

// Iniciar sesión
const login = (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Autenticación fallida" });

  res.json({ message: "Autenticación satisfactoria" });
};

module.exports = { register, login };