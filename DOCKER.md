# Docker инструкции

## Установка Docker

Для работы с Docker необходимо установить [Docker Desktop для Windows](https://www.docker.com/products/docker-desktop/).

После установки убедитесь, что Docker запущен (иконка Docker в системном трее).

## Быстрый старт

### Production режим
# Для новых версий Docker (Docker Desktop 4.0+)
docker compose up --build

# Для старых версий
docker-compose up --build

Запускает оба сервиса (frontend и backend) в production режиме:
- Frontend: http://localhost:3000 (nginx)
- Backend: http://localhost:3001 (Express API)

### Development режим (с hot reload)

# Для новых версий Docker
docker compose -f docker-compose.dev.yml up --build

# Для старых версий
docker-compose -f docker-compose.dev.yml up --build


Запускает сервисы в режиме разработки с автоматической перезагрузкой:
- Изменения в коде применяются автоматически
- Frontend использует Vite dev server
- Backend использует nodemon

## Управление контейнерами

### Остановка

docker compose down

### Просмотр логов

# Все сервисы
docker compose logs -f

# Только frontend
docker compose logs -f frontend

# Только backend
docker compose logs -f api
### Пересборка образов

docker compose build --no-cache

### Очистка

# Остановить и удалить контейнеры
docker compose down

# Удалить также volumes
docker compose down -v

# Удалить образы
docker compose down --rmi all

## Архитектура

### Frontend (Dockerfile)
- Multi-stage build
- Stage 1: Сборка React приложения с Vite
- Stage 2: Nginx для раздачи статических файлов
- Проксирование API запросов через nginx

### Backend (tech-int3-server/Dockerfile)
- Node.js 20 Alpine
- Express API сервер
- Production зависимости только

### Сеть
- Оба сервиса в одной Docker сети `moderation-network`
- Frontend обращается к API через имя сервиса `api:3001`

## Healthchecks

Оба сервиса имеют healthchecks для мониторинга состояния:
- API: проверка доступности `/api/v1/ads`
- Frontend: проверка доступности главной страницы

## Переменные окружения

### Frontend
- `REACT_APP_API_URL` - URL API сервера (по умолчанию проксируется через nginx)

### Backend
- `PORT` - порт API сервера (по умолчанию 3001)
- `NODE_ENV` - окружение (production/development)

## Troubleshooting

### Проблема: Frontend не может подключиться к API

Проверьте:
1. Оба контейнера запущены: `docker compose ps`
2. API доступен: `curl http://localhost:3001/api/v1/ads` или откройте в браузере
3. Логи API: `docker compose logs api`

### Проблема: Изменения не применяются в dev режиме

Убедитесь, что используете `docker-compose.dev.yml` и volumes правильно смонтированы.

### Проблема: Порт уже занят

Измените порты в `docker-compose.yml`:

ports:
  - "8080:80"

Также проверьте, что Docker Desktop запущен и работает.

