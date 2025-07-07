import { useState } from 'react';

import { useCreateQueue, useTasks } from '@/api/query';
import { CreateQueueDtoModel, ELockStrategy, ExeTypes } from '@tasks/lib';

import styles from './createQueue.module.css';

const exeTypesStrings = Object.keys(ExeTypes).filter((maybeKey) =>
  isNaN(maybeKey as any)
);
export const CreateQueue = () => {

  const d = useCreateQueue();
  const [shown, setShown] = useState(true);
    const {
      data: tasks,
      isLoading: isLoadingTasks,
      error: errorTasks,
    } = useTasks();
    console.log('tasks: ', tasks);
  const [state, setState] = useState<CreateQueueDtoModel>({
    name: 'queue1',
    tasks: [],
    schedule: '0 0/5 * * * ? *',
    lockStrategy: ELockStrategy.pauseOnLock
  });
  console.log('state: ', state);

  const updateKey =
    (key: keyof CreateQueueDtoModel) => (value: string) => {
      setState({
        ...state,
        [key]: value,
      });
    };

  const toggleArrayEl =
    (key: keyof CreateQueueDtoModel) => (value: CreateQueueDtoModel["tasks"][0]) => {
      const existingArray = state[key] as any[];
      if (existingArray.includes(value)) {
        setState({
          ...state,
          [key]: [...existingArray.filter((el) => el !== value)],
        });
      } else {
        setState({
          ...state,
          [key]: [...existingArray, value],
        });
      }
    };

  const addQueue = () => {
    d.mutate(state);
  };

  const toggleShown = () => setShown(!shown);
  return (
    <div className={styles.createQueue}>
      <div className={styles.header}>
        <h3 onClick={toggleShown}>Create Queue</h3>
        {shown && <button onClick={toggleShown}>x</button>}
      </div>
      {shown && (
        <>
          <span>Queue name</span>

          <input
            type="text"
            onChange={(e) => updateKey('name')(e.target.value)}
            value={state.name}
          />
          <span>Exe type</span>


          <span>Tasks</span>
          <select
            value={state.tasks as unknown as string[]}
            multiple={true}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onChange={(e) => {}}
          >
            {tasks
              .filter((el) => !el.queue)
              .map((key) => (
                <option
                  key={key.id}
                  value={key.id}
                  // selected={state.tasks.includes(key.id)}
                  onClick={(e) => toggleArrayEl('tasks')(key.id)}
                >
                  {key.name}
                </option>
              ))}
          </select>
          <span>Schedule</span>
          <input
            type="text"
            onChange={(e) => updateKey('schedule')(e.target.value)}
            value={state.schedule}
          />
          {/* <span>Lock strategy</span>
          <select
            value={state.lockStrategy}
            onChange={(e) =>
              updateKey('lockStrategy')(e.target.value as ELockStrategy)
            }
          >
            {Object.keys(ELockStrategy).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select> */}
          <button onClick={addQueue}>Add Queue</button>
        </>
      )}
    </div>
  );
};
