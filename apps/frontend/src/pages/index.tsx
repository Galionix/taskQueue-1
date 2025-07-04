import styles from './index.module.css';
import { useTasks } from '@/api/query';

export function Index() {

  const { data: tasks, isLoading, error } = useTasks();

  if (error)
    return (
      <div>
        No tasks found. But error we did!
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  if (isLoading) return <div>Loading tasks...</div>;
  return (
    <div className={styles.page}>
      <h1>Tasks</h1>

      <ul>
        {tasks!.map((t) => (
          <li key={t.id}>
            <span>{`Name:  ${t.name}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Index;
