import { useState } from 'react';
import Column from './components/Column/Column.jsx';
import './App.css';

function App() {

  const columns = ["To Do", "In Progress", "On Hold", "Completed"]
  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    "On Hold": [],
    "Completed": [],
  });

  const addTask = (column, task) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [column]: [...(prevTasks[column] || []), task],
    }));
  };

  const deleteTask = (column, index) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [column]: prevTasks[column].filter((_, i) => i !== index),
    }));
  };


  const clearTasks = (column) => {
    setTasks(() => ({
      [column]: [],
    }));
  };

  return (
    <div className="App">
      <div className="header-container">
        <h1 className="title">Welcome to YouKanBan!</h1>
        <h2>This is your productivity app dream come true</h2>
        <h2>Today's Tasks</h2>
      </div>
      <div className="column-container">
        {columns.map((column) => (
          <Column
            key={column}
            title={column}
            tasks={tasks[column]}
            onAddTask={(task) => addTask(column, task)}
            onDeleteTask={(index) => deleteTask(column, index)}
            onClearTasks={() => clearTasks(column)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
