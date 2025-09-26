import React, { useState } from 'react';
import { Plus, Monitor, Trash2, Power, RotateCcw } from 'lucide-react';
import { 
  useBrowsers, 
  useCreateBrowser, 
  useDeleteBrowser, 
  useToggleBrowserActive, 
  useRestartBrowserEngines 
} from '../../api/query';

interface CreateBrowserData {
  name: string;
  description?: string;
  isActive: boolean;
}

const BrowserManagement: React.FC = () => {
  const { data: browsers = [], isLoading: loading, error } = useBrowsers();
  const createBrowserMutation = useCreateBrowser();
  const deleteBrowserMutation = useDeleteBrowser();
  const toggleBrowserMutation = useToggleBrowserActive();
  const restartEnginesMutation = useRestartBrowserEngines();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBrowser, setNewBrowser] = useState<CreateBrowserData>({
    name: '',
    description: '',
    isActive: true
  });

  const createBrowser = async () => {
    try {
      await createBrowserMutation.mutateAsync(newBrowser);
      setShowCreateModal(false);
      setNewBrowser({ name: '', description: '', isActive: true });
    } catch (error) {
      console.error('Failed to create browser:', error);
    }
  };

  const deleteBrowser = async (id: number) => {
    if (!confirm('Вы уверены что хотите удалить этот браузер?')) return;

    try {
      await deleteBrowserMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete browser:', error);
    }
  };

  const toggleBrowserActive = async (id: number) => {
    try {
      await toggleBrowserMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to toggle browser:', error);
    }
  };

  const restartEngines = async () => {
    try {
      await restartEnginesMutation.mutateAsync();
      alert('Браузерные движки перезапущены!');
    } catch (error) {
      console.error('Failed to restart engines:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление браузерами</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <Plus size={16} />
            Добавить браузер
          </button>
          <button
            onClick={restartEngines}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            <RotateCcw size={16} />
            Перезапустить движки
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {browsers.map((browser) => (
          <div
            key={browser.id}
            className={`border rounded-lg p-4 ${
              browser.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Monitor className={browser.isActive ? 'text-green-500' : 'text-gray-400'} size={24} />
                <div>
                  <h3 className="font-semibold text-lg">{browser.name}</h3>
                  {browser.description && (
                    <p className="text-gray-600">{browser.description}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Создан: {new Date(browser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  browser.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {browser.isActive ? 'Активен' : 'Неактивен'}
                </span>
                
                <button
                  onClick={() => toggleBrowserActive(browser.id)}
                  className={`p-2 rounded ${
                    browser.isActive 
                      ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                  title={browser.isActive ? 'Деактивировать' : 'Активировать'}
                >
                  <Power size={16} />
                </button>
                
                <button
                  onClick={() => deleteBrowser(browser.id)}
                  className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  title="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Browser Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Создать новый браузер</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Название</label>
              <input
                type="text"
                value={newBrowser.name}
                onChange={(e) => setNewBrowser({ ...newBrowser, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="personal-account"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Описание</label>
              <input
                type="text"
                value={newBrowser.description}
                onChange={(e) => setNewBrowser({ ...newBrowser, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Личный Google аккаунт"
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newBrowser.isActive}
                  onChange={(e) => setNewBrowser({ ...newBrowser, isActive: e.target.checked })}
                  className="mr-2"
                />
                Активен
              </label>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={createBrowser}
                disabled={!newBrowser.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserManagement;
