import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'https://express-api-production-26b8.up.railway.app';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  // Axios instance with auth header
  const authAxios = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Load todos when logged in
  useEffect(() => {
    if (token) fetchTodos();
  }, [token]);

  const fetchTodos = async () => {
    try {
      const res = await authAxios.get('/todos');
      setTodos(res.data);
    } catch {
      logout();
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const res = await axios.post(`${API}${endpoint}`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await authAxios.post('/todos', { text });
    setText('');
    fetchTodos();
  };

  const toggleTodo = async (todo) => {
    await authAxios.put(`/todos/${todo._id}`, { done: !todo.done });
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    await authAxios.delete(`/todos/${id}`);
    fetchTodos();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setTodos([]);
  };

  // ===== LOGIN / SIGNUP SCREEN =====
  if (!token) {
    return (
      <div className="app">
        <h1>{isLogin ? '🔐 Login' : '📝 Sign Up'}</h1>
        <form onSubmit={handleAuth} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="switch" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </p>
      </div>
    );
  }

  // ===== TODO SCREEN =====
  return (
    <div className="app">
      <div className="header">
        <h1>📝 My Todos</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>

      <form onSubmit={addTodo} className="input-group">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a new todo..."
        />
        <button type="submit">Add</button>
      </form>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo._id} className={todo.done ? 'done' : ''}>
            <span onClick={() => toggleTodo(todo)}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo._id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;