import { useState } from 'react';

import { useDeleteTask, useQueues, useTasks } from '@/api/query';
import { CreateTask } from '@/components/task/create/CreateTask';
import { Layout } from '@/components/layout';

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
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>❌ Error Loading Tasks</h2>
          <details className={styles.errorDetails}>
            <summary>Show details</summary>
            <pre>{JSON.stringify(errorTasks, null, 2)}</pre>
          </details>
        </div>
      </div>
    );

  if (errorQueues)
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>❌ Error Loading Queues</h2>
          <details className={styles.errorDetails}>
            <summary>Show details</summary>
            <pre>{JSON.stringify(errorQueues, null, 2)}</pre>
          </details>
        </div>
      </div>
    );

  if (isLoadingTasks || isLoadingQueues)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );

  return (
    <Layout
      onRestartEngine={restartEngine}
      isRestartingEngine={restartQueueEngine.isPending}
    >
      <div className={styles.container}>
        {/* Queues Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📋 Queues ({queues.length})</h2>
          </div>

          <div className={styles.cardsGrid}>
            {queues.map((queue) => (
              <div key={queue.id} className={styles.card}>
                <EditQueue q={queue} />
              </div>
            ))}
            <div className={styles.card + ' ' + styles.createCard}>
              <CreateQueue />
            </div>
          </div>
        </section>

        {/* Tasks Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>⚙️ Tasks ({tasks.length})</h2>

            <div className={styles.filterContainer}>
              <label className={styles.filterLabel}>Filter:</label>
              <select
                className={styles.filterSelect}
                value={taskFilter.hasQueue ? 'hasQueue' : 'all'}
                onChange={(e) =>
                  setTaskFilter({
                    hasQueue: e.target.value === 'hasQueue',
                  })
                }
              >
                <option value="all">All Tasks</option>
                <option value="hasQueue">Tasks with Queue</option>
              </select>
            </div>
          </div>

          <div className={styles.cardsGrid}>
            {tasks
              .filter((task) => {
                if (taskFilter.hasQueue) {
                  return task.queue;
                }
                return true;
              })
              .map((task) => (
                <div key={task.id} className={styles.card}>
                  <EditTask task={task} />
                </div>
              ))}
            <div className={styles.card + ' ' + styles.createCard}>
              <CreateTask />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Index;
