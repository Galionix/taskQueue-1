import { useState } from 'react';

import { useCreateQueue, useTasks } from '@/api/query';
import { CreateQueueDtoModel, ELockStrategy } from '@tasks/lib';

import styles from './createQueue.module.css';

export const CreateQueue = () => {
  const createQueue = useCreateQueue();
  const [shown, setShown] = useState(false);
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    error: errorTasks,
  } = useTasks();

  const [state, setState] = useState<CreateQueueDtoModel>({
    name: '',
    tasks: [],
    schedule: '0 */5 * * * *',
    lockStrategy: ELockStrategy.pauseOnLock,
    isActive: true,
  });

  const updateKey = (key: keyof CreateQueueDtoModel) => (value: string) => {
    setState({
      ...state,
      [key]: value,
    });
  };

  const toggleTask = (taskId: number) => {
    const currentTasks = state.tasks || [];
    if (currentTasks.includes(taskId)) {
      setState({
        ...state,
        tasks: currentTasks.filter((id) => id !== taskId),
      });
    } else {
      setState({
        ...state,
        tasks: [...currentTasks, taskId],
      });
    }
  };

  const addQueue = () => {
    if (state.name.trim()) {
      createQueue.mutate(state);
      setState({
        name: '',
        tasks: [],
        schedule: '0 */5 * * * *',
        lockStrategy: ELockStrategy.pauseOnLock,
        isActive: true,
      });
      setShown(false);
    }
  };

  if (!shown) {
    return (
      <div className={styles.createCard} onClick={() => setShown(true)}>
        <button className={styles.createButton}>➕ Create New Queue</button>
      </div>
    );
  }

  return (
    <div className={styles.createQueue}>
      <div className={styles.header}>
        <h3>✨ Create Queue</h3>
        <button onClick={() => setShown(false)} className={styles.closeButton}>
          ✕
        </button>
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Queue Name</label>
          <input
            type="text"
            onChange={(e) => updateKey('name')(e.target.value)}
            value={state.name}
            className={styles.formInput}
            placeholder="Enter queue name"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Schedule (Cron Expression)</label>
          <input
            type="text"
            onChange={(e) => updateKey('schedule')(e.target.value)}
            value={state.schedule}
            className={styles.formInput}
            placeholder="e.g., 0 */5 * * * *"
          />
          <small style={{ color: '#718096', fontSize: '0.85rem' }}>
            Every 5 minutes: "0 */5 * * * *" | Every hour: "0 0 * * * *"
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Tasks ({state.tasks?.length || 0} selected)
          </label>
          {isLoadingTasks ? (
            <p style={{ color: '#718096', fontStyle: 'italic' }}>
              Loading tasks...
            </p>
          ) : errorTasks ? (
            <p style={{ color: '#e53e3e', fontStyle: 'italic' }}>
              Error loading tasks
            </p>
          ) : (
            <div className={styles.tasksList}>
              <div className={styles.tasksGrid}>
                {tasks
                  ?.filter((task) => !task.queue) // Only show tasks without queue
                  ?.map((task) => {
                    const isSelected = state.tasks?.includes(task.id);
                    return (
                      <label
                        key={task.id}
                        className={`${styles.taskCheckbox} ${
                          isSelected ? styles.checked : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTask(task.id)}
                        />
                        {task.name}
                      </label>
                    );
                  })}
              </div>
              {tasks?.filter((task) => !task.queue).length === 0 && (
                <p
                  style={{
                    color: '#718096',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  No available tasks to add to queue
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={addQueue}
          className={styles.submitButton}
          disabled={createQueue.isPending || !state.name.trim()}
        >
          {createQueue.isPending ? '⏳ Creating...' : '🚀 Create Queue'}
        </button>
      </div>
    </div>
  );
};
