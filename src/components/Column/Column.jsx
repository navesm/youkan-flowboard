import React, { useState } from 'react';
import SortableTask from '../Task/Task.jsx';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import './Column.css';

function Column({ title, tasks = [], onAddTask, onDeleteTask, onClearTasks }) {
  const [taskInput, setTaskInput] = useState('');
  const { setNodeRef } = useDroppable({
    id: `${title}|droppable`
  })

  const handleInputChange = (e) => {
    setTaskInput(e.target.value);
  }

  const handleAddTask = () => {
    if (taskInput.trim() === "") return;
    onAddTask(taskInput);
    setTaskInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const sortableItems = tasks.map(task => `${title}|${task.id}`);



  return (
    <div className="column">
      <div className={`column-header ${title.toLowerCase().replace(" ", "-")}`}>
        <h2>{title}</h2>
      </div>
      <div ref={setNodeRef} className="droppable-area">
        <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
          <div className="tasks">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <SortableTask
                  className="task"
                  key={`${title}|${task.id}`}
                  id={`${title}|${task.id}`}
                  content={task.content}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))
            ) : (
              <p>No Tasks yet!</p>
            )}
          </div>
        </SortableContext>
      </div>
      <input
        type="text"
        placeholder="New Task"
        className="task-input"
        value={taskInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
      />
      <button className="add-task-button" onClick={(handleAddTask)}>Add Task</button>
      {
        title === "Completed" && tasks.length > 0 && (
          <button className="clear-tasks-button" onClick={onClearTasks}>
            Clear Tasks
          </button>
        )
      }
    </div >
  );
}

export default Column;