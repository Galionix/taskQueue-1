import { CreateTask } from '@/components/task/create/CreateTask';
import styles from './index.module.css';
import { useDeleteTask, useTasks } from '@/api/query';

export function Index() {
  const { data: tasks, isLoading, error } = useTasks();

  const d = useDeleteTask();
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
      <CreateTask />
      <h1>Tasks</h1>

      <ul>
        {tasks!.map((t) => (
          <li key={t.id}>
            <span>{`Name:  ${t.name}`}</span>
            <button onClick={() => d.mutate(t.id)}>x</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Index;
