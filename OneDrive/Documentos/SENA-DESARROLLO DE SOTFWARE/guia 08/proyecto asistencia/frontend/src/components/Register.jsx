import { useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: '',
  });

  const [mensaje, setMensaje] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje(`Registro exitoso! ID: ${data.id}`);
        setForm({ nombre: '', correo: '', password: '', rol: '' });
      } else {
        setMensaje(`Error: ${data.error}`);
      }
    } catch (error) {
      setMensaje(`Error de conexión: ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo"
          value={form.correo}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 8 }}
        />
        <select
          name="rol"
          value={form.rol}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 8 }}
        >
          <option value="">Seleccione un rol</option>
          <option value="Admin">Admin</option>
          <option value="Auxiliar">Auxiliar</option>
        </select>
        <button type="submit" style={{ width: '100%' }}>
          Registrarse
        </button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}
