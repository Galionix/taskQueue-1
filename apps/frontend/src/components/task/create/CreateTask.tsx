import { useState } from 'react';

import { TaskModal } from '../TaskModal';
import styles from './createTask.module.css';

export const CreateTask = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className={styles.createCard} onClick={() => setIsModalOpen(true)}>
        <button className={styles.createButton}>➕ Create New Task</button>
      </div>
      
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
