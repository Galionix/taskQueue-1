import { useUpdateTask } from '@/api/query';
import { TaskModel, UpdateTaskDtoModel } from '@tasks/lib';
import { useState } from 'react';

// edit task component

export const EditTask = ({ task }: { task: TaskModel }) => {
  const [showEdit, setShowEdit] = useState(false);
  const updateTask = useUpdateTask();
  const [newData, setNewData] = useState<TaskModel>(task);

  const updateKey =
    (key: keyof TaskModel) => (value: TaskModel[typeof key]) => {
      setNewData({
        ...newData,
        [key]: value,
      });
    };

  if (!showEdit)
    return (
      <div onClick={() => setShowEdit(true)}>
        <label>Name:</label>
        <span>{task.name}</span>
      </div>
    );

  return (
    <div>
      <button onClick={() => setShowEdit(false)}>x</button>
      <label>Name</label>
      <input
        type="text"
        value={newData.name}
        onChange={(e) => updateKey('name')(e.target.value)}
      />
      {/* <label>Description</label>
      <textarea
        value={newData.description}
        onChange={(e) => updateKey('description')(e.target.value)}
      /> */}
          <label>Payload</label>
          <textarea
              value={newData.payload}
              onChange={(e) => updateKey('payload')(e.target.value)}
            />
      <button
        onClick={() =>
          updateTask.mutate({
            id: task.id,
            data: newData as UpdateTaskDtoModel,
          })
        }
      >
        Save
      </button>
    </div>
  );
};
