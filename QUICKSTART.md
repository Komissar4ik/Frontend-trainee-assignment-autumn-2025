# Быстрый запуск проекта

## 🐳 Запуск с Docker (рекомендуется)

> **Важно:** Для работы с Docker необходимо установить [Docker Desktop](https://www.docker.com/products/docker-desktop/) для Windows.

# Сначала требуется скачать репозиторий
git clone [ссылка на репозиторий из GitHub]

# Перейти в папку
cd [путь до папки]

### Production режим
# Для новых версий Docker (рекомендуется)

```bash
docker compose up --build
```

# Для старых версий (если docker compose не работает)

```bash
docker-compose up --build
```
### Development режим (с hot reload)
# Для новых версий Docker

```bash
docker compose -f docker-compose.dev.yml up --build
```

# Для старых версий

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**После запуска:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

**Остановка:**

```bash
docker compose down
```

# или для старых версий:

```bash
docker-compose down
```

## 💻 Локальный запуск (без Docker)

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск Backend API

```bash
cd tech-int3-server
npm install
npm start
```

API будет доступен на http://localhost:3001

### 3. Запуск Frontend (в новом терминале)

```bash
npm run dev
```

Приложение будет доступно на http://localhost:3000

## 🧪 Тестирование

# Запуск тестов

```bash
npm test
```

# Тесты с покрытием

```bash
npm run test:coverage
```

# Тесты в watch режиме

```bash
npm run test:watch
```

## 📦 Сборка для production

```bash
npm run build
```

## ⚡ Полезные команды

# Просмотр логов Docker

```bash
docker compose logs -f
```

# Пересборка образов

```bash
docker compose build --no-cache
```

# Очистка Docker

```bash
docker compose down -v
```
