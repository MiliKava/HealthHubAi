# CareBridge AI

Welcome to the CareBridge AI project! This repository contains the foundation for the Triage + Doctor Marketplace platform.

## Getting Started (Phase 1)

Follow these instructions to get the project up and running locally. We are using Docker and Docker Compose to manage our services (Frontend, Backend, and PostgreSQL with pgvector).

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop).

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MiliKava/HealthHubAi.git
   cd HealthHubAi
   ```

2. **Set up Environment Variables:**
   Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   # On Windows (Command Prompt)
   copy .env.example .env
   
   # On macOS/Linux/Git Bash
   cp .env.example .env
   ```
   *Note: For local development with Docker, the default values in `.env.example` are sufficient to get started.*

3. **Start the Services:**
   Use Docker Compose to build and start the database, backend, and frontend containers in the background:
   ```bash
   docker compose up --build -d
   ```

4. **Run Database Migrations:**
   Once the containers are running, you need to apply the initial database migrations. This creates the required `users` table and enables the `pgvector` extension. Run the migrations inside the backend container:
   ```bash
   docker compose exec backend alembic upgrade head
   ```

### Accessing the Application

- **Frontend Interface:** Open your browser and navigate to [http://localhost:5173](http://localhost:5173). You should see the "CareBridge AI — coming soon" placeholder page.
- **Backend API:** The FastAPI backend is running on [http://localhost:8000](http://localhost:8000).
- **Backend Health Check:** Visit [http://localhost:8000/health](http://localhost:8000/health) to verify the backend is successfully connected to the database (it should return `{"status": "ok"}`).

### Optional: Local Development Tools

If you want to run linting or get IDE autocompletion outside of Docker, you can install the dependencies locally:

**Backend:**
```bash
cd backend
python -m venv health-env
# Activate the virtual environment
# Windows: health-env\Scripts\activate
# Mac/Linux: source health-env/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

---

[![Author](https://img.shields.io/badge/Author-Nigam%20Vaghani-4F46E5?style=for-the-badge)](https://github.com/Nigam-Vaghani)
[![Author](https://img.shields.io/badge/Author-Mili%20Kava-E546B4?style=for-the-badge)](https://github.com/MiliKava)
