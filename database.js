// database.js
const mongoose = require('mongoose');

// Conexión a MongoDB (asegúrate de que MongoDB esté corriendo)
mongoose.connect('mongodb://localhost:27017/comentariosDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Definición del esquema del comentario
const comentarioSchema = new mongoose.Schema({
  nombre: String,
  comentario: String
});

// Creación del modelo del comentario
const Comentario = mongoose.model('Comentario', comentarioSchema);

// Función para guardar un nuevo comentario
const guardarComentario = async (nombre, comentario) => {
  const nuevoComentario = new Comentario({ nombre, comentario });
  await nuevoComentario.save();
  console.log('Comentario guardado');
};

// Ejemplo de uso
guardarComentario('Usuario1', 'Este es un comentario de prueba').catch(err => console.log(err));
