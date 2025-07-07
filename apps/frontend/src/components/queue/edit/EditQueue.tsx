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
  console.log('newData: ', newData);

  const updateKey =
    (key: keyof QueueModel) => (value: QueueModel[typeof key]) => {
      setNewData({
        ...newData,
        [key]: value,
      });
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
      <input
        type="text"
        value={newData.name}
        onChange={(e) => updateKey('name')(e.target.value)}
      />
      <label>Tasks</label>
      <ArrangeableSelect
        options={tasks || []}
        value={newData.tasks as unknown as number[]}
        onChange={updateKey('tasks') as (value: number[]) => void}
      />
      {/* <select
        value={newData.tasks as unknown as string[]}
        multiple={true}
        onChange={(e) => {
          const selectedOptions = Array.from(
            e.target.selectedOptions,
            (option) => +option.value
          );
          updateKey('tasks')(selectedOptions as unknown as QueueModel['tasks']);
        }}
      >
        {tasks?.map((task) => (
          <option key={task.id} value={task.id}>
            {task.name}
          </option>
        ))}
      </select> */}
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
      >
        Update
      </button>
      <button onClick={() => deleteQueue.mutate(q.id)}>Delete</button>
    </div>
  );
};

// this component is just simple select option with handling arrows up and down to rearrange options
const ArrangeableSelect = ({
  options,
  value,
  onChange,
}: {
  options: { id: number; name: string }[];

  value: number[];
  onChange: (value: number[]) => void;
  }) => {
  const [arrangedOptions, setArrangedOptions] = useState(options);
  // State to manage the selected options and active index
  const [selectedOptions, setSelectedOptions] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  console.log('activeIndex: ', activeIndex);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    // handling
    console.log('e.key: ', e.key);
    // setSelectedOptions([]);
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      // Move the active index up
      setArrangedOptions((prev) => {
        const newOptions = [...prev];
        const temp = newOptions[activeIndex - 1];
        newOptions[activeIndex - 1] = newOptions[activeIndex];
        newOptions[activeIndex] = temp;
        return newOptions;
      }
      );
      setActiveIndex((prev) => prev - 1);
    } else if (
      e.key === 'ArrowDown'
    ) {
      e.preventDefault();
      e.stopPropagation();

      setArrangedOptions((prev) => {
        const newOptions = [...prev];
        const temp = newOptions[activeIndex + 1];
        newOptions[activeIndex + 1] = newOptions[activeIndex];
        newOptions[activeIndex] = temp;
        return newOptions;
      }
      );
      setActiveIndex((prev) => prev + 1);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (option) => +option.value);
    setSelectedOptions(selected);
    onChange(selected);
  };
  return (
    <select
      multiple={true}
      value={selectedOptions.map(callbackfn => callbackfn.toString())}
      size={Math.max(3, options.length)} // Ensure at least 3 visible options
      onChange={handleChange}
      onClick={(e) => {
        console.log('e: ', e.target.value);
        // Reset active index when clicking on the select
        const index = options.findIndex(
          (option) => option.id.toString() === e.target.value
        );
        console.log('index: ', index);
        setActiveIndex(index);
      }}
      onKeyDown={handleKeyDown}
      className={s.arrangeableSelect}
    >
      {arrangedOptions.map((option, index) => (
        <option
          key={option.id}
          value={option.id.toString()}
          className={
            index === activeIndex ? s.activeOption : s.inactiveOption
          }
        >
          {option.name}
        </option>
      ))}
    </select>
  );
}