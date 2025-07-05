import { useCreateTask } from '@/api/query';
import { CreateTaskDto, ExeTypes, ExeTypesPayloadMap } from '@/api/types';
import { useState } from 'react';
import styles from './createTask.module.css';

const exeTypesStrings = Object.keys(ExeTypes).filter((maybeKey) =>
  isNaN(maybeKey as any)
);
export const CreateTask = () => {
  const d = useCreateTask();
  const [shown, setShown] = useState(false);

  const [state, setState] = useState<CreateTaskDto>({
    dependencies: [],
    exeType: exeTypesStrings[0],
    name: 'Task Name',
    payload: JSON.stringify(ExeTypesPayloadMap[0], null, 2),
  });
  console.log('state: ', state);

  const updateKey =
    (key: keyof CreateTaskDto) => (value: string | ExeTypes[]) => {
      setState({
        ...state,
        [key]: value,
      });
    };

  const toggleArrayEl =
    (key: keyof CreateTaskDto) => (value: string | ExeTypes[]) => {
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

  const upadateExeType = (newType) => {
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
    d.mutate(state);
  };

  const toggleShown = () => setShown(!shown);
  return (
    <div className={styles.createTask}>
      <div className={styles.header}>
        <h3 onClick={toggleShown}>Create Task</h3>
        {shown && <button onClick={toggleShown}>x</button>}
      </div>
      {shown && (
        <>
          <span>Task name</span>

          <input
            type="text"
            onChange={(e) => updateKey('name')(e.target.value)}
            value={state.name}
          />
          <span>Exe type</span>

          <select
            onChange={(e) => upadateExeType(e.target.value)}
            value={state.exeType}
          >
            {exeTypesStrings.map((key, i) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <span>Dependencies</span>
          <select
            value={state.dependencies as unknown as string[]}
            multiple={true}
            onChange={(e) => {}}
          >
            {exeTypesStrings
              .filter((el) => el !== state.exeType)
              .map((key) => (
                <option
                  key={key}
                  onClick={(e) => toggleArrayEl('dependencies')(key)}
                >
                  {key}
                </option>
              ))}
          </select>
          <span>Payload</span>

          <textarea
            cols={40}
            rows={6}
            onChange={(e) => updateKey('payload')(e.target.value)}
            value={state.payload}
          />
          <button onClick={addTask}>Add Task</button>
        </>
      )}
    </div>
  );
};
