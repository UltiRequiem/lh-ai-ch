# DocProc

![Screenshot](./screenshot.png)

A simple document processing system for uploading, viewing, and searching PDF documents.

## Features

- Upload PDF documents
- View list of uploaded documents
- Search across document content
- View individual document details with extracted text
- Delete documents

## Tech Stack

- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0 (async), PostgreSQL
- **Frontend:** React 18, Vite, React Router
- **Infrastructure:** Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Git

### Running the Application

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd docproc
   ```

2. Start all services:

   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development

To run services individually for development:

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Documents

| Method | Endpoint          | Description           |
| ------ | ----------------- | --------------------- |
| POST   | `/documents`      | Upload a PDF document |
| GET    | `/documents`      | List all documents    |
| GET    | `/documents/{id}` | Get document details  |
| DELETE | `/documents/{id}` | Delete a document     |

### Search

| Method | Endpoint            | Description                 |
| ------ | ------------------- | --------------------------- |
| GET    | `/search?q={query}` | Search documents by content |

### Health

| Method | Endpoint  | Description           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Health check endpoint |

## Project Structure

```
docproc/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py         # Configuration
│   │   ├── database.py       # Database setup
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── routes/           # API routes
│   │   └── services/         # Business logic
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── api.js           # API client
│   │   └── App.jsx          # Main application
│   ├── Dockerfile
│   └── package.json
├── scripts/
│   └── seed_data.py         # Test data seeding
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend

| Variable       | Description                  | Default                |
| -------------- | ---------------------------- | ---------------------- |
| `DATABASE_URL` | PostgreSQL connection string | See docker-compose.yml |

### Frontend

| Variable       | Description     | Default                 |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |
