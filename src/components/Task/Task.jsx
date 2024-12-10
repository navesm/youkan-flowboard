import { useSortable } from '@dnd-kit/sortable';
import { CSS } from "@dnd-kit/utilities"
import './Task.css';

function SortableTask({ id, content, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: "10px",
    margin: "5px 0",
    background: "lightgrey",
    borderRadius: "5px",
    cursor: "grab",
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  return (
    <div
      className="task"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <span>{content}</span>
      <button
        className="delete-button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete()
        }}
      >
        &times;
      </button>
    </div>
  );
}

export default SortableTask;