import { useState } from 'react';

import { useCreateTask, useTasks } from '@/api/query';
import { CreateTaskDtoModel, ExeTypes, ExeTypesPayloadMap } from '@tasks/lib';

import styles from './createTask.module.css';

const exeTypesStrings = Object.keys(ExeTypes).filter((maybeKey) =>
  isNaN(maybeKey as any)
);

export const CreateTask = () => {
  const createTask = useCreateTask();
  const { data: allTasks } = useTasks();
  const [shown, setShown] = useState(false);

  const [state, setState] = useState<CreateTaskDtoModel>({
    dependencies: [],
    exeType: exeTypesStrings[0],
    name: '',
    payload: JSON.stringify(ExeTypesPayloadMap[0], null, 2),
    queues: [], // Add queues field
  });

  const updateKey =
    (key: keyof CreateTaskDtoModel) => (value: string | ExeTypes[]) => {
      setState({
        ...state,
        [key]: value,
      });
    };

  const toggleDependency = (taskId: number) => {
    const currentDeps = state.dependencies || [];
    if (currentDeps.includes(taskId)) {
      setState({
        ...state,
        dependencies: currentDeps.filter((id) => id !== taskId),
      });
    } else {
      setState({
        ...state,
        dependencies: [...currentDeps, taskId],
      });
    }
  };

  const updateExeType = (newType: string) => {
    setState({
      ...state,
      exeType: newType,
      payload: JSON.stringify(
        ExeTypesPayloadMap[exeTypesStrings.indexOf(newType)],
        null,
        2
      ),
    });
  };

  const addTask = () => {
    if (state.name.trim()) {
      createTask.mutate(state);
      setState({
        dependencies: [],
        exeType: exeTypesStrings[0],
        name: '',
        payload: JSON.stringify(ExeTypesPayloadMap[0], null, 2),
        queues: [], // Add queues field
      });
      setShown(false);
    }
  };

  if (!shown) {
    return (
      <div className={styles.createCard} onClick={() => setShown(true)}>
        <button className={styles.createButton}>➕ Create New Task</button>
      </div>
    );
  }

  return (
    <div className={styles.createTask}>
      <div className={styles.header}>
        <h3>✨ Create Task</h3>
        <button onClick={() => setShown(false)} className={styles.closeButton}>
          ✕
        </button>
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Task Name</label>
          <input
            type="text"
            onChange={(e) => updateKey('name')(e.target.value)}
            value={state.name}
            className={styles.formInput}
            placeholder="Enter task name"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Execution Type</label>
          <select
            onChange={(e) => updateExeType(e.target.value)}
            value={state.exeType}
            className={styles.formSelect}
          >
            {exeTypesStrings.map((key) => (
              <option key={key} value={key}>
                {key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Payload (JSON)</label>
          <textarea
            onChange={(e) => updateKey('payload')(e.target.value)}
            value={state.payload}
            className={styles.formTextarea}
            placeholder="Enter JSON payload"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Dependencies ({state.dependencies?.length || 0} selected)
          </label>
          <div className={styles.dependenciesList}>
            <div className={styles.dependenciesGrid}>
              {allTasks?.map((task) => {
                const isSelected = state.dependencies?.includes(task.id);
                return (
                  <label
                    key={task.id}
                    className={`${styles.dependencyCheckbox} ${
                      isSelected ? styles.checked : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDependency(task.id)}
                    />
                    {task.name}
                  </label>
                );
              })}
            </div>
            {(!allTasks || allTasks.length === 0) && (
              <p
                style={{
                  color: '#718096',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                No existing tasks to depend on
              </p>
            )}
          </div>
        </div>

        <button
          onClick={addTask}
          className={styles.submitButton}
          disabled={createTask.isPending || !state.name.trim()}
        >
          {createTask.isPending ? '⏳ Creating...' : '🚀 Create Task'}
        </button>
      </div>
    </div>
  );
};
