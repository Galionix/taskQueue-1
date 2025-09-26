import React from 'react';
import { Layout } from '../components/layout';
import BrowserManagement from '../components/browser/BrowserManagement';
import { useRestartQueueEngine } from '../api/engine';

const BrowsersPage: React.FC = () => {
  const restartQueueEngine = useRestartQueueEngine();
  
  const restartEngine = () => {
    restartQueueEngine.mutate();
  };

  return (
    <Layout
      title="🌐 Browser Management"
      onRestartEngine={restartEngine}
      isRestartingEngine={restartQueueEngine.isPending}
    >
      <BrowserManagement />
    </Layout>
  );
};

export default BrowsersPage;
