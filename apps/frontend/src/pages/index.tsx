import { useState } from 'react';

import { useDeleteTask, useQueues, useTasks } from '@/api/query';
import { CreateTask } from '@/components/task/create/CreateTask';

import { useRestartQueueEngine } from '../api/engine';
import { CreateQueue } from '../components/queue/create/CreateQueue';
import { EditQueue } from '../components/queue/edit/EditQueue';
import styles from './index.module.css';
import { EditTask } from '@/components/task/edit/EditTask';

export function Index() {
  const restartQueueEngine = useRestartQueueEngine();
  const restartEngine = () => {
    restartQueueEngine.mutate();
  };
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    error: errorTasks,
  } = useTasks();
  const {
    data: queues,
    isLoading: isLoadingQueues,
    error: errorQueues,
  } = useQueues();

  const [taskFilter, setTaskFilter] = useState({
    hasQueue: true,
  });
  const d = useDeleteTask();
  if (errorTasks)
    return (
      <div>
        No tasks found. But error we did!
        <pre>{JSON.stringify(errorTasks, null, 2)}</pre>
      </div>
    );
  if (errorQueues)
    return (
      <div>
        No queues found. But error we did!
        <pre>{JSON.stringify(errorQueues, null, 2)}</pre>
      </div>
    );
  if (isLoadingTasks) return <div>Loading tasks...</div>;
  if (isLoadingQueues) return <div>Loading queues...</div>;
  return (
    <div className={styles.page}>
      <button onClick={restartEngine}>Restart Queue Engine</button>
      <h1>Queues: {queues.length}</h1>

      <ul>
        {queues.map((t) => (
          <li key={t.id}>
            <EditQueue q={t} />
            {/* <span>{`Name:  ${t.name}`}</span> */}
            {/* <button onClick={() => d.mutate(t.id)}>x</button> */}
          </li>
        ))}
      </ul>
      <CreateQueue />
      <h1>Tasks: {tasks.length}</h1>
      <select
        value={Object.entries(taskFilter)
          .filter(([_, val]) => val)
          .map(([k, v]) => k)}
        multiple={true}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onChange={(e) => {}}
      >
        {Object.entries(taskFilter)
          // .filter((el) => el !== state.exeType)
          .map((key) => (
            <option
              key={key[0]}
              onClick={(e) =>
                setTaskFilter({
                  ...taskFilter,
                  [key[0]]: !key[1],
                })
              }
            >
              {key}
            </option>
          ))}
      </select>
      <ul>
        {tasks
          .filter((task) => {
            if (taskFilter.hasQueue) {
              return task.queue;
            }
            return true;
          })
          .map((t) => (
            <li key={t.id}>
              <EditTask task={t} />
              {/* <span>{`Name:  ${t.name}`}</span>
              <button onClick={() => d.mutate(t.id)}>x</button> */}
            </li>
          ))}
      </ul>
      <CreateTask />
    </div>
  );
}

export default Index;
