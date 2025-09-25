import { useDeleteTask } from '@/api/query';
import { TaskModel } from '@tasks/lib';
import { useState } from 'react';

import { TaskModal } from '../TaskModal';
import s from './editTask.module.css';

export const EditTask = ({ task }: { task: TaskModel }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const deleteTask = useDeleteTask();

  const getExeTypeDisplay = (exeType: string) => {
    // Convert camelCase/snake_case to readable format
    return exeType
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const truncatePayload = (payload: string, maxLength = 100) => {
    if (payload.length <= maxLength) return payload;
    return payload.substring(0, maxLength) + '...';
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
      deleteTask.mutate(task.id);
    }
  };

  return (
    <>
      <div className={s.preview}>
        <div className={s.previewHeader}>
          <h3 className={s.taskName}>{task.name}</h3>
          <div className={s.typeBadge}>{getExeTypeDisplay(task.exeType)}</div>
        </div>

        <div className={s.previewContent}>
          <div className={s.infoRow}>
            <span className={s.infoIcon}>🔧</span>
            <span className={s.infoLabel}>Type:</span>
            <span className={s.infoValue}>{task.exeType}</span>
          </div>

          <div className={s.infoRow}>
            <span className={s.infoIcon}>🔗</span>
            <span className={s.infoLabel}>Dependencies:</span>
            <span className={s.infoValue}>
              {task.dependencies?.length || 0}
            </span>
          </div>

          <div className={s.infoRow}>
            <span className={s.infoIcon}>📋</span>
            <span className={s.infoLabel}>Queues:</span>
            <span className={s.infoValue}>
              {task.queues &&
              Array.isArray(task.queues) &&
              task.queues.length > 0
                ? `${task.queues.length} queue${
                    task.queues.length > 1 ? 's' : ''
                  } (${task.queues.join(', ')})`
                : 'No Queues'}
            </span>
          </div>

          {task.payload && (
            <div>
              <div className={s.infoRow}>
                <span className={s.infoIcon}>📄</span>
                <span className={s.infoLabel}>Payload:</span>
              </div>
              <div className={s.payloadPreview}>
                {truncatePayload(task.payload)}
              </div>
            </div>
          )}
        </div>

        <div className={s.actionButtons}>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className={s.editButton}
            title="Edit Task"
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDelete}
            className={s.deleteButton}
            disabled={deleteTask.isPending}
            title="Delete Task"
          >
            {deleteTask.isPending ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>

      <TaskModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
      />
    </>
  );
};
