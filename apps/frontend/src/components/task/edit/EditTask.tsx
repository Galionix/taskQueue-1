import { useDeleteTask, useUpdateTask, useTasks } from '@/api/query';
import { TaskModel, UpdateTaskDtoModel } from '@tasks/lib';
import { useState } from 'react';
import s from './editTask.module.css';

export const EditTask = ({ task }: { task: TaskModel }) => {
  const [showEdit, setShowEdit] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: allTasks } = useTasks();
  const [newData, setNewData] = useState<TaskModel>(task);

  const updateKey =
    (key: keyof TaskModel) => (value: TaskModel[typeof key]) => {
      setNewData({
        ...newData,
        [key]: value,
      });
    };

  const getExeTypeDisplay = (exeType: string) => {
    // Convert camelCase/snake_case to readable format
    return exeType
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const truncatePayload = (payload: string, maxLength: number = 100) => {
    if (payload.length <= maxLength) return payload;
    return payload.substring(0, maxLength) + '...';
  };

  if (!showEdit)
    return (
      <div className={s.preview} onClick={() => setShowEdit(true)}>
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
      </div>
    );

  return (
    <div className={s.editForm}>
      <div className={s.editHeader}>
        <h3 className={s.editTitle}>✏️ Edit Task</h3>
        <div className={s.actionButtons}>
          <button
            onClick={() => {
              setShowEdit(false);
              setNewData(task); // Reset changes
            }}
            className={s.closeButton}
            title="Cancel"
          >
            ✕
          </button>
        </div>
      </div>

      <div className={s.formGroup}>
        <label className={s.formLabel}>Task Name</label>
        <input
          type="text"
          value={newData.name}
          onChange={(e) => updateKey('name')(e.target.value)}
          className={s.formInput}
          placeholder="Enter task name"
        />
      </div>

      <div className={s.formGroup}>
        <label className={s.formLabel}>Execution Type</label>
        <input
          type="text"
          value={newData.exeType}
          onChange={(e) => updateKey('exeType')(e.target.value)}
          className={s.formInput}
          placeholder="e.g., open_browser_tab"
        />
      </div>

      <div className={s.formGroup}>
        <label className={s.formLabel}>Payload (JSON)</label>
        <textarea
          value={newData.payload}
          onChange={(e) => updateKey('payload')(e.target.value)}
          className={s.formTextarea}
          placeholder="Enter JSON payload"
        />
      </div>

      <div className={s.formGroup}>
        <label className={s.formLabel}>
          Dependencies (
          {Array.isArray(newData.dependencies)
            ? newData.dependencies.length
            : 0}{' '}
          selected)
        </label>
        <div className={s.dependenciesList}>
          <div className={s.dependenciesGrid}>
            {allTasks
              ?.filter((t) => t.id !== task.id)
              .map((dep) => {
                const isSelected = Array.isArray(newData.dependencies)
                  ? newData.dependencies.includes(dep.id)
                  : false;
                return (
                  <label
                    key={dep.id}
                    className={`${s.dependencyCheckbox} ${
                      isSelected ? s.checked : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const currentDeps = Array.isArray(newData.dependencies)
                          ? newData.dependencies
                          : [];
                        if (e.target.checked) {
                          updateKey('dependencies')([...currentDeps, dep.id]);
                        } else {
                          updateKey('dependencies')(
                            currentDeps.filter((id) => id !== dep.id)
                          );
                        }
                      }}
                    />
                    {dep.name}
                  </label>
                );
              })}
          </div>
        </div>
      </div>

      <div
        className={s.actionButtons}
        style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '25px' }}
      >
        <button
          onClick={() => {
            updateTask.mutate({
              id: task.id,
              data: newData as UpdateTaskDtoModel,
            });
            setShowEdit(false);
          }}
          className={s.saveButton}
          disabled={updateTask.isPending}
        >
          {updateTask.isPending ? '⏳ Saving...' : '💾 Save Changes'}
        </button>

        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
              deleteTask.mutate(task.id);
            }
          }}
          className={s.deleteButton}
          disabled={deleteTask.isPending}
        >
          {deleteTask.isPending ? '⏳ Deleting...' : '🗑️ Delete'}
        </button>
      </div>
    </div>
  );
};
