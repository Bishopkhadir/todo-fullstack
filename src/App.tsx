import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import './App.css';

const API = 'https://express-api-production-26b8.up.railway.app';

interface Todo {
  _id: string;
  text: string;
  done: boolean;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

interface AuthResponse {
  token: string;
  email: string;
}

function App() {
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [error, setError] = useState<string>('');

  const authAxios = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    if (token) fetchTodos();
  }, [token]);

  const fetchTodos = async (): Promise<void> => {
    try {
      const res = await authAxios.get<Todo[]>('/todos');
      setTodos(res.data);
    } catch {
      logout();
    }
  };

  const handleAuth = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const res = await axios.post<AuthResponse>(`${API}${endpoint}`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setEmail('');
      setPassword('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Something went wrong');
    }
  };

  const addTodo = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!text.trim()) return;
    await authAxios.post('/todos', { text, dueDate, priority });
    setText('');
    setDueDate('');
    setPriority('medium');
    fetchTodos();
  };

  const toggleTodo = async (todo: Todo): Promise<void> => {
    await authAxios.put(`/todos/${todo._id}`, { done: !todo.done });
    fetchTodos();
  };

  const deleteTodo = async (id: string): Promise<void> => {
    await authAxios.delete(`/todos/${id}`);
    fetchTodos();
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setToken('');
    setTodos([]);
  };

  const priorityLabel = (p: string) => {
    if (p === 'high') return '🔴 High';
    if (p === 'low') return '🟢 Low';
    return '🟡 Medium';
  };

  const isOverdue = (todo: Todo): boolean => {
    if (!todo.dueDate || todo.done) return false;
    const today = new Date().toISOString().split('T')[0];
    return todo.dueDate < today;
  };

  // LOGIN / SIGNUP
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

  // TODO SCREEN
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
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo._id} className={todo.done ? 'done' : ''}>
            <span className="text" onClick={() => toggleTodo(todo)}>{todo.text}</span>
            <span className={`priority priority-${todo.priority}`}>
              {priorityLabel(todo.priority)}
            </span>
            {todo.dueDate && (
              <span className={isOverdue(todo) ? 'overdue' : 'due-date'}>
                📅 {todo.dueDate} {isOverdue(todo) && '⚠️'}
              </span>
            )}
            <button onClick={() => deleteTodo(todo._id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;