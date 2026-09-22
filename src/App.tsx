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
  createdAt: string;
}

interface AuthResponse {
  token: string;
  email: string;
}

type Filter = 'all' | 'active' | 'completed';

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
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'dueDate' | 'priority'>('newest');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const authAxios = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    if (token) fetchTodos();
  }, [token, filter, search, sortBy]);

  const fetchTodos = async (): Promise<void> => {
    try {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.filter = filter;
      if (search) params.search = search;

      const res = await authAxios.get<Todo[]>('/todos', { params });
      let sorted = [...res.data];

      if (sortBy === 'dueDate') {
        sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
      } else if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) => order[a.priority] - order[b.priority]);
      }

      setTodos(sorted);
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
    if (!window.confirm('Delete this todo?')) return;
    await authAxios.delete(`/todos/${id}`);
    fetchTodos();
  };

  const startEdit = (todo: Todo): void => {
    setEditingId(todo._id);
    setEditText(todo.text);
    setEditDueDate(todo.dueDate || '');
    setEditPriority(todo.priority);
  };

  const saveEdit = async (): Promise<void> => {
    if (!editingId) return;
    await authAxios.put(`/todos/${editingId}`, {
      text: editText,
      dueDate: editDueDate,
      priority: editPriority
    });
    setEditingId(null);
    fetchTodos();
  };

  const cancelEdit = (): void => {
    setEditingId(null);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setToken('');
    setTodos([]);
  };

  const priorityLabel = (p: string): string => {
    if (p === 'high') return '🔴 High';
    if (p === 'low') return '🟢 Low';
    return '🟡 Medium';
  };

  const isOverdue = (todo: Todo): boolean => {
    if (!todo.dueDate || todo.done) return false;
    const today = new Date().toISOString().split('T')[0];
    return todo.dueDate < today;
  };

  const stats = {
    total: todos.length,
    done: todos.filter(t => t.done).length,
    pending: todos.filter(t => !t.done).length
  };

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

  return (
    <div className="app">
      <div className="header">
        <h1>📝 My Todos</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>

      <div className="stats">
        <span>📊 Total: {stats.total}</span>
        <span>✅ Done: {stats.done}</span>
        <span>⏳ Pending: {stats.pending}</span>
      </div>

      <form onSubmit={addTodo} className="input-group">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a new todo..."
        />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <div className="controls">
        <input
          className="search"
          placeholder="🔍 Search todos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Done</button>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'dueDate' | 'priority')}>
          <option value="newest">Newest</option>
          <option value="dueDate">By Due Date</option>
          <option value="priority">By Priority</option>
        </select>
      </div>

      <ul className="todo-list">
        {todos.length === 0 && <li className="empty">No todos found</li>}
        {todos.map((todo) => (
          <li key={todo._id} className={todo.done ? 'done' : ''}>
            {editingId === todo._id ? (
              <div className="edit-row">
                <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
                <button onClick={saveEdit} className="save-btn">✓</button>
                <button onClick={cancelEdit} className="cancel-btn">✕</button>
              </div>
            ) : (
              <>
                <span className="text" onClick={() => toggleTodo(todo)}>{todo.text}</span>
                <span className={`priority priority-${todo.priority}`}>{priorityLabel(todo.priority)}</span>
                {todo.dueDate && (
                  <span className={isOverdue(todo) ? 'overdue' : 'due-date'}>
                    📅 {todo.dueDate} {isOverdue(todo) && '⚠️'}
                  </span>
                )}
                <button className="edit-btn" onClick={() => startEdit(todo)}>✏️</button>
                <button className="delete-btn" onClick={() => deleteTodo(todo._id)}>✕</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;