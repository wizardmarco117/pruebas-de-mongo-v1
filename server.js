const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;
const secret = 'mysecret';

// Conexión a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/comentariosDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('No se pudo conectar a MongoDB', err));

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

const comentarioSchema = new mongoose.Schema({
  nombre: String,
  comentario: String
});

const User = mongoose.model('User', userSchema);
const Comentario = mongoose.model('Comentario', comentarioSchema);

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

// Endpoint para crear usuario
app.post('/crear-usuario', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const nuevoUsuario = new User({ username, password: hashedPassword, role });

  try {
    await nuevoUsuario.save();
    res.status(200).send('Usuario creado');
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).send('Error al crear el usuario');
  }
});

// Endpoint para iniciar sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).send('Credenciales incorrectas');
  }
});

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(403).send('Token requerido');

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      console.error('Error al verificar el token:', err);
      return res.status(500).send('Token inválido');
    }
    req.user = decoded;
    next();
  });
};

// Endpoint para obtener todos los usuarios
app.get('/usuarios', verifyToken, async (req, res) => {
  console.log('Token verificado:', req.user);
  try {
    const usuarios = await User.find();
    console.log('Usuarios obtenidos:', usuarios);
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).send('Error al obtener los usuarios');
  }
});

// Endpoint para eliminar usuario por ID
app.delete('/usuarios/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Permisos insuficientes');
  
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send('Usuario eliminado');
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).send('Error al eliminar el usuario');
  }
});

// Endpoint para guardar comentario
app.post('/guardar-comentario', async (req, res) => {
  const { nombre, comentario } = req.body;

  try {
    const nuevoComentario = new Comentario({ nombre, comentario });
    await nuevoComentario.save();
    res.status(200).send('Comentario guardado');
  } catch (error) {
    res.status(500).send('Error al guardar el comentario');
  }
});

// Endpoint para obtener todos los comentarios
app.get('/comentarios', async (req, res) => {
  try {
    const comentarios = await Comentario.find();
    res.json(comentarios);
  } catch (error) {
    res.status(500).send('Error al obtener los comentarios');
  }
});

// Endpoint para eliminar comentario por ID
app.delete('/comentarios/:id', async (req, res) => {
  try {
    await Comentario.findByIdAndDelete(req.params.id);
    res.status(200).send('Comentario eliminado');
  } catch (error) {
    res.status(500).send('Error al eliminar el comentario');
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
