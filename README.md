# CareBridge AI

Welcome to the CareBridge AI project! This repository contains the foundation for the Triage + Doctor Marketplace platform.

## Getting Started (Phase 1)

Follow these instructions to get the project up and running locally. We are running the Backend and Frontend manually and using a local PostgreSQL installation.

### Prerequisites

- [Node.js](https://nodejs.org/) installed for the frontend.
- [Python 3.8+](https://www.python.org/) installed for the backend.
- [PostgreSQL](https://www.postgresql.org/download/) installed locally (we recommend using **pgAdmin 4** to manage the database).

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MiliKava/HealthHubAi.git
   cd HealthHubAi
   ```

2. **Database Setup (pgAdmin 4):**
   - Open pgAdmin 4 and connect to your local PostgreSQL server (usually `localhost:5432`, user `postgres`).
   - Create a new database named `carebridge`.
   - Update your password in `.env` if it's different from `password`.

3. **Set up Environment Variables:**
   Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   # On Windows (Command Prompt)
   copy .env.example .env
   
   # On macOS/Linux/Git Bash
   cp .env.example .env
   ```
   *Make sure `DATABASE_URL` in `.env` matches your local Postgres credentials (e.g., `postgresql://postgres:yourpassword@localhost:5432/carebridge`).*

4. **Backend Setup:**
   Open a new terminal and run:
   ```bash
   cd backend
   python -m venv health-env
   
   # Activate the virtual environment
   # Windows: 
   health-env\Scripts\activate
   # Mac/Linux: 
   source health-env/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Run Database Migrations
   alembic upgrade head
   
   # Start the Backend Server
   uvicorn app.main:app --reload
   ```

5. **Frontend Setup:**
   Open another new terminal and run:
   ```bash
   cd frontend
   npm install
   
   # Start the Frontend Development Server
   npm run dev
   ```

### Accessing the Application

- **Frontend Interface:** Open your browser and navigate to [http://localhost:5173](http://localhost:5173). You should see the "CareBridge AI — coming soon" placeholder page.
- **Backend API:** The FastAPI backend is running on [http://localhost:8000](http://localhost:8000).
- **Backend Health Check:** Visit [http://localhost:8000/health](http://localhost:8000/health) to verify the backend is successfully connected to the database (it should return `{"status": "ok"}`).

---

[![Author](https://img.shields.io/badge/Author-Nigam%20Vaghani-4F46E5?style=for-the-badge)](https://github.com/Nigam-Vaghani)
[![Author](https://img.shields.io/badge/Author-Mili%20Kava-E546B4?style=for-the-badge)](https://github.com/MiliKava)
