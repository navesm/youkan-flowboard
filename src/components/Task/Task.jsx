import './Task.css';

function Task({ content, onDelete }) {
  return (
    <div className="task">
      <span>{content}</span>
      <button className="delete-button" onClick={onDelete}>
        &times;
      </button>
    </div>
  );
}

export default Task;