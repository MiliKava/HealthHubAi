# CareBridge AI 🩺

> ⚠️ **Note:** This application is currently under active development. Features and endpoints may change frequently as we continue building out the core platform.

Welcome to the **CareBridge AI** project! This repository contains the foundation for an intelligent Triage and Doctor Marketplace platform, designed to accurately evaluate patient symptoms using AI and connect them with the right specialists.

## Tech Stack

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
<br>
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991.svg?style=for-the-badge&logo=OpenAI&logoColor=white)

## Current Progress (Phases 1-10 Completed)

The application is being built in phases. The following core foundational and AI engine features are fully implemented:
1. **Foundation & Auth:** Full infrastructure setup with Docker, JWT Authentication, and RBAC (Patient, Doctor, Admin).
2. **Profile Management:** Patient profile configurations and comprehensive Doctor Onboarding workflows (including automated CV PDF extraction).
3. **Admin Controls:** Secure admin dashboard for evaluating and approving/rejecting doctor applications.
4. **Medical RAG System:** Implementation of the `pgvector` database, MedQuAD dataset ingestion pipeline, and RAG retrieval service for contextual medical knowledge.
5. **Intelligent Triage Engine:** 
   - **Symptom Extraction:** Uses Groq/Gemini/OpenAI to extract and map natural language to a canonical medical vocabulary.
   - **Emergency Detection:** Analyzes symptoms to catch high-risk red flags before proceeding.
   - **Triage Scoring Engine:** Assigns automated risk levels (`low`, `medium`, `high`) and calculates specialist recommendations based on age, duration, severity, and symptom categories.

## System Architecture

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend ["React / Vite Frontend"]
        UI["User Interface"]
        PatientDash["Patient Dashboard"]
        DoctorDash["Doctor Dashboard"]
        AdminDash["Admin Panel"]
    end

    %% Backend Layer
    subgraph Backend ["FastAPI Backend"]
        API["API Router"]
        AuthSvc["Auth & RBAC Service"]
        DocSvc["Doctor Onboarding & PDF Service"]
        
        %% Triage Pipeline
        subgraph TriagePipeline ["Intelligent Triage Pipeline"]
            SympExt["Symptom Extraction (LLM)"]
            RedFlag["Red-Flag Emergency Detection"]
            TriageScore["Triage Scoring Engine"]
        end
        
        %% RAG System
        subgraph KnowledgeSystem ["RAG Knowledge System"]
            CorpusPipe["Corpus Ingestion Pipeline"]
            RAG["RAG Retrieval Service"]
        end
    end

    %% Database Layer
    subgraph Database ["PostgreSQL + pgvector"]
        UsersDB[("Users & Roles")]
        ProfilesDB[("Profiles & Applications")]
        VectorDB[("Medical Embeddings")]
    end

    %% External APIs
    LLM["External LLM APIs<br>(Groq, Gemini, OpenAI)"]

    %% Connections
    UI <--> API
    API <--> AuthSvc
    API <--> DocSvc
    API <--> SympExt
    
    AuthSvc <--> UsersDB
    DocSvc <--> ProfilesDB
    
    SympExt --> |"Raw Text"| LLM
    LLM --> |"Canonical JSON"| SympExt
    
    SympExt --> |"Canonical Symptoms"| RedFlag
    RedFlag --> |"If safe (No Red-Flags)"| TriageScore
    
    CorpusPipe --> |"Chunking & Embeddings"| VectorDB
    RAG <--> |"Similarity Search"| VectorDB
```

## Getting Started

This application has been fully containerized using Docker, making it incredibly easy to spin up the Frontend, Backend, and Database with a single command. 

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MiliKava/HealthHubAi.git
   cd HealthHubAi
   ```

2. **Set up Environment Variables:**
   Duplicate the `.env.example` file inside the `backend` folder and rename it to `.env`:
   ```bash
   # On Windows
   copy backend\.env.example backend\.env
   
   # On macOS/Linux
   cp backend/.env.example backend/.env
   ```
   *(Note: The `docker-compose.yml` automatically passes the correct `DATABASE_URL` to the containers, so you do not need to manually configure the database URL unless you are running it outside of Docker).*

3. **Start the Application:**
   Spin up the entire stack (PostgreSQL with `pgvector`, FastAPI Backend, and Vite Frontend) in the background:
   ```bash
   docker-compose up -d --build
   ```

4. **Seed the Database (Optional):**
   To add the default Admin user, run this command inside the running backend container:
   ```bash
   docker-compose exec backend python seed_admin.py
   ```

5. **Ingest Medical Knowledge (Phase 6):**
   To test the AI Vector Database, you can ingest the MedQuAD dataset into `pgvector` by running:
   ```bash
   docker-compose exec backend python scripts/ingest_corpus.py
   ```

### Accessing the Application

- **Frontend Interface:** Open your browser and navigate to [http://localhost:5173](http://localhost:5173).
  - **Admin Access:** You can log in using `admin@carebridge.ai` and `admin123` to access the Admin Panel to approve doctor applications.
- **Backend API Docs:** The FastAPI interactive documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).
- **Database Access:** The PostgreSQL database is mapped to your local port `5433` (to avoid conflicts with local installations). You can connect via pgAdmin using `localhost:5433`, user `postgres`, password `password`, and database `carebridge`.

---

[![Author](https://img.shields.io/badge/Author-Nigam%20Vaghani-4F46E5?style=for-the-badge)](https://github.com/Nigam-Vaghani)
[![Author](https://img.shields.io/badge/Author-Mili%20Kava-E546B4?style=for-the-badge)](https://github.com/MiliKava)


project is in development phase, stay tuned.
