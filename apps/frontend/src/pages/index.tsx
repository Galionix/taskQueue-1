import { useState } from 'react';

import { useDeleteTask, useQueues, useTasks } from '@/api/query';
import { CreateTask } from '@/components/task/create/CreateTask';
import { Layout } from '@/components/layout';
import { ExeTypes } from '@tasks/lib';

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
    exeType: 'all',
    queueStatus: 'all',
    searchText: '',
  });
  const d = useDeleteTask();

  // Filter logic
  const filterTasks = (tasksList: any[]) => {
    console.log(
      'All tasks:',
      tasksList.map((t) => ({ id: t.id, name: t.name, queues: t.queues }))
    );

    const filtered = tasksList.filter((task) => {
      // Search filter
      if (
        taskFilter.searchText &&
        !task.name.toLowerCase().includes(taskFilter.searchText.toLowerCase())
      ) {
        return false;
      }

      // Execution type filter
      if (taskFilter.exeType !== 'all' && task.exeType !== taskFilter.exeType) {
        return false;
      }

      // Queue status filter
      if (taskFilter.queueStatus === 'with_queue') {
        // Проверяем, есть ли у задачи очереди (массив должен быть не пустым)
        const hasQueues =
          task.queues && Array.isArray(task.queues) && task.queues.length > 0;
        if (!hasQueues) {
          return false;
        }
      }
      if (taskFilter.queueStatus === 'without_queue') {
        // Проверяем, что у задачи нет очередей (массив пустой или null/undefined)
        const hasQueues =
          task.queues && Array.isArray(task.queues) && task.queues.length > 0;
        if (hasQueues) {
          return false;
        }
      }

      return true;
    });

    console.log(
      'Filtered tasks:',
      filtered.map((t) => ({ id: t.id, name: t.name, queues: t.queues }))
    );
    console.log('Current filter:', taskFilter);

    return filtered;
  };

  const filteredTasks = filterTasks(tasks || []);

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
            <h2 className={styles.sectionTitle}>
              ⚙️ Tasks ({filteredTasks.length}/{tasks.length})
            </h2>

            <div className={styles.filtersContainer}>
              {/* Search Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>🔍 Search:</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Search by name..."
                  value={taskFilter.searchText}
                  onChange={(e) =>
                    setTaskFilter((prev) => ({
                      ...prev,
                      searchText: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Execution Type Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>⚙️ Type:</label>
                <select
                  className={styles.filterSelect}
                  value={taskFilter.exeType}
                  onChange={(e) =>
                    setTaskFilter((prev) => ({
                      ...prev,
                      exeType: e.target.value,
                    }))
                  }
                >
                  <option value="all">All Types</option>
                  {Object.keys(ExeTypes)
                    .filter((key) => isNaN(Number(key)))
                    .map((exeType) => (
                      <option key={exeType} value={exeType}>
                        {exeType
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                </select>
              </div>

              {/* Queue Status Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>📋 Queue:</label>
                <select
                  className={styles.filterSelect}
                  value={taskFilter.queueStatus}
                  onChange={(e) =>
                    setTaskFilter((prev) => ({
                      ...prev,
                      queueStatus: e.target.value,
                    }))
                  }
                >
                  <option value="all">All Tasks</option>
                  <option value="with_queue">With Queue</option>
                  <option value="without_queue">Without Queue</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(taskFilter.searchText ||
                taskFilter.exeType !== 'all' ||
                taskFilter.queueStatus !== 'all') && (
                <button
                  className={styles.clearFiltersBtn}
                  onClick={() =>
                    setTaskFilter({
                      exeType: 'all',
                      queueStatus: 'all',
                      searchText: '',
                    })
                  }
                >
                  ✖️ Clear
                </button>
              )}
            </div>
          </div>

          <div className={styles.cardsGrid}>
            {filteredTasks.map((task) => (
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
