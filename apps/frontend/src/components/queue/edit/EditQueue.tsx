import { useState } from 'react';

import { QueueModel } from '@tasks/lib';

import { useDeleteQueue, useTasks, useUpdateQueue, useToggleQueueActivity } from '../../../api/query';
import s from './editQueue.module.css';

export const EditQueue = ({ q }: { q: QueueModel }) => {
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    error: errorTasks,
  } = useTasks();
  const [showEdit, setShowEdit] = useState(false);
  const updateQueue = useUpdateQueue();
  const deleteQueue = useDeleteQueue();
  const toggleActivity = useToggleQueueActivity();

  const [newData, setNewData] = useState<QueueModel>({
    ...q,
    tasks: Array.isArray(q.tasks) ? q.tasks : [],
  });

  // Debug: log the queue data to see what we're working with
  console.log('EditQueue - Queue data:', {
    id: q.id,
    name: q.name,
    tasks: q.tasks,
    tasksType: typeof q.tasks,
    tasksIsArray: Array.isArray(q.tasks),
    tasksContent: q.tasks, // Detailed content
    newDataTasks: newData.tasks, // What we're actually using
  });

  // Debug: check render conditions
  console.log('Render conditions:', {
    isArray: Array.isArray(newData.tasks),
    length: newData.tasks.length,
    shouldRenderCurrentTasks:
      Array.isArray(newData.tasks) && newData.tasks.length > 0,
  });

  const shouldRenderCurrentTasks =
    Array.isArray(newData.tasks) && newData.tasks.length > 0;
  if (shouldRenderCurrentTasks) {
    console.log('✅ Should render current tasks section');
  } else {
    console.log('❌ Will NOT render current tasks section');
  }

  const updateKey =
    (key: keyof QueueModel) => (value: QueueModel[typeof key]) => {
      setNewData({
        ...newData,
        [key]: value,
      });
    };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case '1':
        return '🟢'; // Running
      case '0':
        return '🔴'; // Stopped
      default:
        return '⚪'; // Unknown
    }
  };

  const getStatusText = (state: string) => {
    switch (state) {
      case '1':
        return 'Running';
      case '0':
        return 'Stopped';
      default:
        return 'Unknown';
    }
  };

  const getActivityIcon = (isActive: boolean) => {
    return isActive ? '🟢' : '🔴';
  };

  const getActivityText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  if (!showEdit)
    return (
      <div className={s.preview}>
        <div className={s.previewHeader}>
          <h3 className={s.queueName}>{q.name}</h3>
          <div className={s.badges}>
            <div
              className={`${s.statusBadge} ${q.state === 0 ? s.inactive : ''}`}
            >
              {getStatusIcon(String(q.state))} {getStatusText(String(q.state))}
            </div>
            <div
              className={`${s.activityBadge} ${!q.isActive ? s.inactive : ''}`}
            >
              {getActivityIcon(q.isActive)} {getActivityText(q.isActive)}
            </div>
          </div>
        </div>

        <div className={s.previewContent}>
          <div className={s.infoRow}>
            <span className={s.infoIcon}>📋</span>
            <span className={s.infoLabel}>Tasks:</span>
            <span className={s.tasksCount}>{q.tasks?.length || 0}</span>
          </div>

          <div className={s.infoRow}>
            <span className={s.infoIcon}>⏰</span>
            <span className={s.infoLabel}>Schedule:</span>
            <span className={s.infoValue}>{q.schedule}</span>
          </div>

          {q.currentTaskName && (
            <div className={s.infoRow}>
              <span className={s.infoIcon}>🎯</span>
              <span className={s.infoLabel}>Current:</span>
              <span className={s.infoValue}>{q.currentTaskName}</span>
            </div>
          )}

          {/* Quick action buttons */}
          <div className={s.quickActions} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowEdit(true)}
              className={s.quickButton}
              title="Edit queue"
            >
              ✏️ Edit
            </button>
            {q.tasks && q.tasks.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(`Remove all tasks from "${q.name}"?`)) {
                    updateQueue.mutate({
                      id: q.id,
                      data: { ...q, tasks: [] },
                    });
                  }
                }}
                className={s.quickButton}
                title="Remove all tasks"
                disabled={updateQueue.isPending}
              >
                {updateQueue.isPending ? '⏳' : '🗑️ Clear'}
              </button>
            )}
            <button
              onClick={() => {
                if (
                  confirm(
                    `${q.isActive ? 'Deactivate' : 'Activate'} queue "${
                      q.name
                    }"?\n\n${
                      q.isActive
                        ? 'Queue will not run automatically by schedule.'
                        : 'Queue will run automatically by schedule.'
                    }`
                  )
                ) {
                  toggleActivity.mutate(q.id);
                }
              }}
              className={`${s.quickButton} ${
                q.isActive ? s.activeButton : s.inactiveButton
              }`}
              title={`${
                q.isActive ? 'Deactivate' : 'Activate'
              } automatic queue execution`}
              disabled={toggleActivity.isPending}
            >
              {toggleActivity.isPending
                ? '⏳'
                : q.isActive
                ? '🔴 Deactivate'
                : '🟢 Activate'}
            </button>
          </div>
        </div>
      </div>
    );

  if (isLoadingTasks) {
    return <div className={s.loadingContainer}>Loading tasks...</div>;
  }

  if (errorTasks) {
    return <div className={s.errorContainer}>Error loading tasks</div>;
  }

  return (
    <div className={s.editForm}>
      <div className={s.editHeader}>
        <h3 className={s.editTitle}>✏️ Edit Queue</h3>
        <div className={s.actionButtons}>
          <button
            onClick={() => {
              setShowEdit(false);
              setNewData({
                ...q,
                tasks: Array.isArray(q.tasks) ? q.tasks : [],
              }); // Reset changes
            }}
            className={s.closeButton}
            title="Cancel"
          >
            ✕
          </button>
        </div>
      </div>

      <div className={s.formGroup}>
        <label className={s.formLabel}>Queue Name</label>
        <input
          type="text"
          value={newData.name}
          onChange={(e) => updateKey('name')(e.target.value)}
          className={s.formInput}
          placeholder="Enter queue name"
        />
      </div>

      <div className={s.formGroup}>
        <label className={s.formLabel}>
          Tasks in Queue (
          {Array.isArray(newData.tasks) ? newData.tasks.length : 0} tasks)
        </label>
        <div className={s.tasksList}>
          {/* Current tasks in queue */}
          {Array.isArray(newData.tasks) && newData.tasks.length > 0 && (
            <div>
              <div className={s.sectionHeader}>🗂️ Current Tasks in Queue:</div>
              <div className={s.tasksGrid}>
                {tasks
                  ?.filter((task) => {
                    const taskInQueue = newData.tasks.includes(task.id);
                    console.log(
                      `Task ${task.name} (ID: ${task.id}) in queue:`,
                      taskInQueue
                    );
                    return taskInQueue;
                  })
                  .map((task) => (
                    <label
                      key={task.id}
                      className={`${s.taskCheckbox} ${s.checked} ${s.inQueue}`}
                    >
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            const currentTasks = Array.isArray(newData.tasks)
                              ? newData.tasks
                              : [];
                            updateKey('tasks')(
                              currentTasks.filter((id) => id !== task.id)
                            );
                          }
                        }}
                      />
                      {task.name}
                    </label>
                  ))}
              </div>
              <div className={s.helpText}>
                💡 Uncheck tasks to remove them from the queue
              </div>
            </div>
          )}

          {/* Available tasks to add */}
          <div
            style={{
              marginTop:
                Array.isArray(newData.tasks) && newData.tasks.length > 0
                  ? '25px'
                  : '0',
            }}
          >
            <div className={s.sectionHeader}>➕ Available Tasks to Add:</div>
            <div className={s.tasksGrid}>
              {tasks
                ?.filter((task) => {
                  const taskNotInQueue = !newData.tasks.includes(task.id);
                  console.log(
                    `Task ${task.name} (ID: ${task.id}) available to add:`,
                    taskNotInQueue
                  );
                  return taskNotInQueue;
                })
                .map((task) => (
                  <label
                    key={task.id}
                    className={`${s.taskCheckbox} ${s.available}`}
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const currentTasks = Array.isArray(newData.tasks)
                            ? newData.tasks
                            : [];
                          updateKey('tasks')([...currentTasks, task.id]);
                        }
                      }}
                    />
                    {task.name}
                  </label>
                ))}
            </div>
            {tasks?.filter((task) => !newData.tasks.includes(task.id))
              .length === 0 && (
              <p
                style={{
                  color: '#718096',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                No more tasks available to add
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={s.formGroup}>
        <label className={s.formLabel}>Schedule (Cron Expression)</label>
        <input
          type="text"
          value={newData.schedule}
          onChange={(e) => updateKey('schedule')(e.target.value)}
          className={s.formInput}
          placeholder="e.g., 0 */5 * * * *"
        />
        <small
          style={{
            color: '#718096',
            fontSize: '0.85rem',
            marginTop: '5px',
            display: 'block',
          }}
        >
          Every 5 minutes: "0 */5 * * * *" | Every hour: "0 0 * * * *"
        </small>
      </div>

      <div
        className={s.actionButtons}
        style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '25px' }}
      >
        <button
          onClick={() => {
            updateQueue.mutate({
              id: q.id,
              data: newData,
            });
            setShowEdit(false);
          }}
          className={s.saveButton}
          disabled={updateQueue.isPending}
        >
          {updateQueue.isPending ? '⏳ Saving...' : '💾 Save Changes'}
        </button>

        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${q.name}"?`)) {
              deleteQueue.mutate(q.id);
            }
          }}
          className={s.deleteButton}
          disabled={deleteQueue.isPending}
        >
          {deleteQueue.isPending ? '⏳ Deleting...' : '🗑️ Delete'}
        </button>
      </div>
    </div>
  );
};