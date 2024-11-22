import React, { useState } from 'react';
import Task from '../Task/Task.jsx';

function Column({ title, tasks = [], onAddTask, onDeleteTask }) {
  const [taskInput, setTaskInput] = useState('');

  const handleInputChange = (e) => {
    setTaskInput(e.target.value);
  }

  const handleAddTask = () => {
    if (taskInput.trim() === "") return;
    onAddTask(taskInput);
    setTaskInput("");
  };

  return (
    <div className="column">
      <h2>{title}</h2>
      <div className="tasks">
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <Task
              key={index}
              content={task}
              onDelete={() => onDeleteTask(index)}
            />
          ))
        ) : (
          <p>No Tasks yet!</p>
        )}
      </div>
      <input
        type="text"
        placeholder="New Task"
        className="task-input"
        value={taskInput}
        onChange={handleInputChange}
      />
      <button onClick={(handleAddTask)}>Add Task</button>
    </div>
  )
}

export default Column;