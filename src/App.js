import { useEffect, useState, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Column from './components/Column/Column.jsx';
import SignUp from './components/SignUp/SignUp.jsx';
import SignIn from './components/SignIn/SignIn.jsx';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from "@dnd-kit/sortable";
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    "On Hold": [],
    "Completed": [],
  });
  const [activeTask, setActiveTask] = useState(null);


  const columns = useMemo(() => ["To Do", "In Progress", "On Hold", "Completed"], []);

  // Auth Effect
  useEffect(() => {
    // Check session and get user data
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        //Fetch user metadata
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setDisplayName(data.user.user_metadata?.displayName || 'User');
        }
      }
    };

    fetchUserData();

    // Listen for authentication state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Fetch user metadata
        const fetchUserMetaData = async () => {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            setDisplayName(data.user.user_metadata?.displayName || 'User');
          }
        };

        fetchUserMetaData();
      } else {
        setUser(null);
        setDisplayName('');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);


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


  const handleDragEnd = async (event) => {
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

    // Persist to Supabase
    if (user) {
      const { error } = await supabase
        .from('tasks')
        .update({ column: destinationColumn })
        .eq('id', active.id)
        .eq('user_id', user.id);

      if (error) console.error('Error updating task:', error.message);
    }
  };


  const fetchTasks = useCallback(async () => {
    if (!user) return; // Skip if no user

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true }); // Sort by position

    if (error) {
      console.error('Error fetching tasks:', error.message);
      return;
    }

    //Organize tasks by column
    const tasksByColumn = columns.reduce((acc, column) => {
      acc[column] = data.filter((task) => task.column === column);
      return acc;
    }, {});

    setTasks(tasksByColumn);
  }, [user, columns]);

  // Fetch tasks effect
  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  useEffect(() => {
  }, [tasks]);


  const addTask = async (column, taskContent) => {
    const newTask = {
      id: Date.now(),
      content: taskContent,
      position: tasks[column].length,
      column
    };

    // Update local state first
    setTasks((prevTasks) => ({
      ...prevTasks,
      [column]: [...prevTasks[column], newTask]
    }));

    //Persist to Supabase if user is authenticated
    if (user) {
      const { error } = await supabase
        .from('tasks')
        .insert({
          column,
          content: taskContent,
          user_id: user.id,
          position: newTask.position
        });

      if (error) console.error('Error adding task:', error.message);
    }
  };

  const deleteTask = async (column, taskId) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [column]: prevTasks[column].filter((task) => task.id !== taskId),
    }));

    // Persist to Supabase if user is authenticated
    if (user) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) console.error('Error deleting task:', error.message);
    }
  };


  const clearTasks = async (column) => {
    setTasks((prev) => ({
      ...prev,
      [column]: [],
    }));


    // If user is authenticated, also clear from Supabase
    if (user) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('column', column)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing tasks from Supabase:', error.message);
      }
    }
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error.message);
    else setUser(null);
  };


  return (
    <Router>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <header className="header-container">
          <h1 className="title">Welcome to YouKanBan!</h1>
          <h2>{user ? `Hello, ${displayName}!` : "Sign in to save your progress"}</h2>
          <h2>Today's Tasks</h2>
          <div>
            {user ? (
              <button onClick={handleLogout}>Logout</button>
            ) : (
              <>
                <Link to="/sign-in">Sign In</Link> | <Link to="/sign-up">Sign Up</Link>
              </>
            )}
          </div>
        </header>
        <Routes>
          <Route
            path="/"
            element={
              <div className="App">
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
            }
          />
          <Route
            path="/"
            element={
              <div>
                <h1>Welcome to YouKanBan!</h1>
                <h2>Please Sign in to access full features such as saving tasks!</h2>
                <div>
                  <Link to="/sign-in">Sign In</Link> | <Link to="/sign-up">Sign Up </Link>
                </div>
              </div>
            }
          />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </DndContext>
    </Router>
  );
}

export default App;
