import { useState } from 'react';

import { QueueModel } from '@tasks/lib';

import { useDeleteQueue, useTasks, useUpdateQueue } from '../../../api/query';
import s from './editQueue.module.css';

export const EditQueue = ({ q }: { q: QueueModel }) => {
      const {
        data: tasks,
        isLoading: isLoadingTasks,
        error: errorTasks,
      } = useTasks();
  const [showEdit, setShowEdit] = useState(false);
  const updateQueue = useUpdateQueue();
  const [newData, setNewData] = useState<QueueModel>(q);

  const updateKey =
    (key: keyof QueueModel) => (value: QueueModel[typeof key]) => {
      setNewData({
        ...newData,
        [key]: value,
      });
    };

  const toggleArrayEl =
    (key: keyof QueueModel) => (value: QueueModel['tasks'][0]) => {
      const existingArray = newData[key] as any[];
      if (existingArray.includes(value)) {
        setNewData({
          ...newData,
          [key]: [...existingArray.filter((el) => el !== value)],
        });
      } else {
        setNewData({
          ...newData,
          [key]: [...existingArray, value],
        });
      }
    };


  const deleteQueue = useDeleteQueue();
  if (!showEdit)
    return (
      <div className={s.preview} onClick={() => setShowEdit(true)}>
        <label>Name:</label>
        <span>{q.name}</span>
      </div>
    );
  return (
    <div>
      <button onClick={() => setShowEdit(false)}>x</button>
      <label>Name</label>
      <input type="text" value={newData.name} onChange={(e) => updateKey('name')(e.target.value)} />
      <label>Tasks</label>
      <select
        value={newData.tasks as unknown as string[]}
        multiple={true}
        onChange={(e) => {
          const selectedOptions = Array.from(e.target.selectedOptions, option => +option.value);
          updateKey('tasks')(selectedOptions as unknown as QueueModel['tasks']);
        }}
      >
        {tasks?.map((task) => (
          <option
            key={task.id}
            value={task.id}
          >
            {task.name}
          </option>
        ))}
      </select>
      <label>Schedule</label>
      <input
        type="text"
        value={newData.schedule}
        onChange={(e) => updateKey('schedule')(e.target.value)}
      />
      <button
        onClick={() => {
          updateQueue.mutate({
            id: q.id,
            data: newData,
          });
          setShowEdit(false);
        }}
      >Update</button>
      <button
        onClick={() => deleteQueue.mutate(q.id)}
      >Delete</button>
    </div>
  );
};
