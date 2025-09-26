import { useState, useEffect } from 'react';

import { useCreateTask, useUpdateTask, useTasks, useAvailableBrowsers } from '@/api/query';
import { CreateTaskDtoModel, ExeTypes, ExeTypesDescriptionMap, ExeTypesPayloadMap, TaskModel } from '@tasks/lib';

import { Modal } from '../ui/Modal';
import styles from './TaskModal.module.css';

const exeTypesStrings = Object.keys(ExeTypes).filter((maybeKey) =>
  isNaN(Number(maybeKey))
);

interface PayloadInfoProps {
  exeType: string;
  exeTypesStrings: string[];
}

const PayloadInfo = ({ exeType, exeTypesStrings }: PayloadInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: availableBrowsers = [] } = useAvailableBrowsers();
  const exeTypeIndex = exeTypesStrings.indexOf(exeType);
  const description = ExeTypesDescriptionMap[exeTypeIndex];

  if (!description) return null;

  // Add browser information for find_on_page_elements tasks
  let enhancedUsage = description.usage.trim();
  if (exeType === 'find_on_page_elements' && availableBrowsers.length > 0) {
    enhancedUsage = enhancedUsage.replace(
      'browserName: string - The name of the browser to use for this task. Available browsers: default, galaktionovdmytro. Default is \'default\'.',
      `browserName: string - The name of the browser to use for this task. Available browsers: ${availableBrowsers.join(', ')}. Default is 'default'.`
    );
  }

  return (
    <div className={styles.payloadInfo}>
      <button 
        type="button"
        className={styles.payloadInfoToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.payloadInfoIcon}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className={styles.payloadInfoTitle}>
          {description.name} - Payload Information
        </span>
      </button>
      {isExpanded && (
        <div className={styles.payloadInfoContent}>
          <pre className={styles.payloadInfoText}>
            {enhancedUsage}
          </pre>
        </div>
      )}
    </div>
  );
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: TaskModel; // If provided, we're editing; if not, we're creating
}

export const TaskModal = ({ isOpen, onClose, task }: TaskModalProps) => {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: allTasks } = useTasks();
  
  const isEditing = !!task;
  
  const [state, setState] = useState<CreateTaskDtoModel>({
    dependencies: [],
    exeType: exeTypesStrings[0],
    name: '',
    payload: JSON.stringify(ExeTypesPayloadMap[0], null, 2),
    queues: [],
  });

  // Reset form when modal opens/closes or when task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing mode - populate with existing task data
        setState({
          dependencies: task.dependencies || [],
          exeType: task.exeType,
          name: task.name,
          payload: task.payload,
          queues: task.queues || [],
        });
      } else {
        // Creating mode - reset to defaults
        setState({
          dependencies: [],
          exeType: exeTypesStrings[0],
          name: '',
          payload: JSON.stringify(ExeTypesPayloadMap[0], null, 2),
          queues: [],
        });
      }
    }
  }, [isOpen, task]);

  const updateKey =
    (key: keyof CreateTaskDtoModel) => (value: string | number[]) => {
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

  const handleSubmit = () => {
    if (!state.name.trim()) return;

    if (isEditing && task) {
      updateTask.mutate({ id: task.id, data: state });
    } else {
      createTask.mutate(state);
    }
    onClose();
  };

  const availableTasks = allTasks?.filter(t => !isEditing || t.id !== task?.id) || [];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? `✏️ Edit Task: ${task?.name}` : '✨ Create New Task'}
      size="large"
    >
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
          <PayloadInfo 
            exeType={state.exeType} 
            exeTypesStrings={exeTypesStrings}
          />
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
              {availableTasks.map((availableTask) => {
                const isSelected = state.dependencies?.includes(availableTask.id);
                return (
                  <label
                    key={availableTask.id}
                    className={`${styles.dependencyCheckbox} ${
                      isSelected ? styles.checked : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDependency(availableTask.id)}
                    />
                    {availableTask.name}
                  </label>
                );
              })}
            </div>
            {availableTasks.length === 0 && (
              <p className={styles.noTasks}>
                No existing tasks to depend on
              </p>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={styles.submitButton}
            disabled={(createTask.isPending || updateTask.isPending) || !state.name.trim()}
          >
            {(createTask.isPending || updateTask.isPending) 
              ? '⏳ Saving...' 
              : isEditing 
                ? '💾 Update Task' 
                : '🚀 Create Task'
            }
          </button>
        </div>
      </div>
    </Modal>
  );
};
