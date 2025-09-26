# Frontend Browser Management

## Компонент BrowserManagement

Новый React компонент для управления браузерами в административной панели.

## Функциональность

- ✅ Просмотр списка всех браузеров
- ✅ Создание нового браузера
- ✅ Удаление браузера (с подтверждением)
- ✅ Активация/деактивация браузера
- ✅ Перезапуск браузерных движков
- ✅ Индикация статуса (активен/неактивен)

## API Integration

Компонент интегрируется с backend API:
- `GET /api/browsers` - список браузеров
- `POST /api/browsers` - создание браузера
- `DELETE /api/browsers/:id` - удаление браузера
- `PUT /api/browsers/:id/toggle-active` - переключение активности
- `POST /api/browsers/restart-engines` - перезапуск движков

## UI/UX

- Карточный интерфейс для каждого браузера
- Цветовая индикация статуса (зеленый - активен, серый - неактивен)
- Модальное окно для создания браузера
- Подтверждение удаления
- Responsive дизайн

## Использование

```tsx
import BrowserManagement from './components/browser/BrowserManagement';

function App() {
  return (
    <div className="app">
      <BrowserManagement />
    </div>
  );
}
```

## Зависимости

- React
- lucide-react (для иконок)
- TailwindCSS (для стилей)
