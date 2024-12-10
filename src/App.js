import { useState } from 'react';
import Column from './components/Column/Column.jsx';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from "@dnd-kit/sortable";
import './App.css';

function App() {

  const columns = ["To Do", "In Progress", "On Hold", "Completed"]
  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    "On Hold": [],
    "Completed": [],
  });
  const [activeTask, setActiveTask] = useState(null);



  // Add sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const [sourceColumn] = active.id.split('|');
    const task = tasks[sourceColumn].find(
      task => `${sourceColumn}|${task.id}` === active.id
    );

    setActiveTask(task);
  }


  const handleDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!active || !over) return;

    const activeId = active.id;
    const overId = over.id;

    // Extract column and task information
    const [sourceColumn] = activeId.split("|");
    const [destinationColumn, overTaskId] = overId.split("|");

    //Handle task reorder within the same column
    if (sourceColumn === destinationColumn) {
      const columnTasks = tasks[sourceColumn];
      const oldIndex = columnTasks.findIndex(task => `${sourceColumn}|${task.id}` === activeId);
      const newIndex = columnTasks.findIndex(task => `${sourceColumn}|${task.id}` === overId)

      const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);

      setTasks((prev) => ({ ...prev, [sourceColumn]: reorderedTasks }));
    } else {
      //Handle task move between columns
      const sourceColumnTasks = [...tasks[sourceColumn]];
      const destinationColumnTasks = [...tasks[destinationColumn]];

      const taskIndex = sourceColumnTasks.findIndex(task => `${sourceColumn}|${task.id}` === activeId);
      const [movedTask] = sourceColumnTasks.splice(taskIndex, 1);

      const destinationIndex = overTaskId
        ? destinationColumnTasks.findIndex(task => `${destinationColumn}|${task.id}` === overId)
        : destinationColumnTasks.length;

      destinationColumnTasks.splice(destinationIndex, 0, movedTask);

      setTasks((prev) => ({
        ...prev,
        [sourceColumn]: sourceColumnTasks,
        [destinationColumn]: destinationColumnTasks,
      }));
    }
  };



  const addTask = (column, taskContent) => {
    const newTask = {
      id: Date.now(),
      content: taskContent
    };

    setTasks((prevTasks) => ({
      ...prevTasks,
      [column]: [...prevTasks[column], newTask]
    }));
  };

  const deleteTask = (column, taskId) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [column]: prevTasks[column].filter((task) => task.id !== taskId),
    }));
  };


  const clearTasks = (column) => {
    setTasks((prev) => ({
      ...prev,
      [column]: [],
    }));
  };

  const TaskOverlay = ({ content }) => {
    return (
      <div style={{
        padding: '10px',
        background: 'lightgrey',
        borderRadius: '5px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        cursor: 'grabbing',
        width: '200px'
      }}>
        {content}
      </div>
    );
  };


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
              onDeleteTask={(taskId) => deleteTask(column, taskId)}
              onClearTasks={() => clearTasks(column)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskOverlay content={activeTask.content} /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
