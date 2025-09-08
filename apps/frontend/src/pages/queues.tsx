import React from 'react';
import { useQueues } from '../api/query';
import { EditQueue } from '../components/queue/edit/EditQueue';

const QueueManagement: React.FC = () => {
  const { data: queues, isLoading, error } = useQueues();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        🔄 Loading queues...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '1.2rem',
        color: '#e53e3e'
      }}>
        ❌ Error loading queues: {error.message}
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem', 
          color: '#2d3748' 
        }}>
          📋 Queue Management
        </h1>
        <div style={{
          background: 'linear-gradient(135deg, #4299e1, #3182ce)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '16px',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          {queues?.length || 0} queues
        </div>
      </div>

      <div style={{
        background: '#f7fafc',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ 
          margin: '0 0 12px 0',
          fontSize: '1.1rem',
          color: '#4a5568'
        }}>
          💡 Activity Management
        </h3>
        <p style={{ 
          margin: 0,
          color: '#718096',
          lineHeight: '1.5'
        }}>
          • <strong>🟢 Active</strong> - Queue runs automatically by schedule and available for manual execution<br/>
          • <strong>🔴 Inactive</strong> - Queue does NOT run by schedule but still available for manual execution<br/>
          • Click the activity button to toggle between active/inactive states
        </p>
      </div>

      {!queues || queues.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: '#f7fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
          <h3 style={{ 
            color: '#4a5568', 
            margin: '0 0 8px 0',
            fontSize: '1.3rem'
          }}>
            No queues found
          </h3>
          <p style={{ 
            color: '#718096', 
            margin: 0,
            fontSize: '1rem'
          }}>
            Create your first queue to get started with task automation
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {queues.map((queue) => (
            <div 
              key={queue.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              <EditQueue q={queue} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueueManagement;
