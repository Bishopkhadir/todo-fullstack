import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:3000/todos';

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  // Load todos
  const fetchTodos = async () => {
    const res = await axios.get(API);
    setTodos(res.data);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // Add todo
  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await axios.post(API, { text });
    setText('');
    fetchTodos();
  };

  // Toggle done
  const toggleTodo = async (todo) => {
    await axios.put(`${API}/${todo._id}`, { done: !todo.done });
    fetchTodos();
  };

  // Delete todo
  const deleteTodo = async (id) => {
    await axios.delete(`${API}/${id}`);
    fetchTodos();
  };

  return (
    <div className="app">
      <h1>📝 Full Stack Todo</h1>

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