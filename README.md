# HealthHub AI 🩺

> ⚠️ **Note:** This application is currently under active development. Features and endpoints may change frequently as we continue building out the core platform.

Welcome to the **HealthHub AI** project! This repository contains the foundation for an intelligent Triage and Doctor Marketplace platform, designed to accurately evaluate patient symptoms using AI and connect them with the right specialists.

## Tech Stack

<div align="center">
  <h3>Frontend</h3>
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Zustand-%23333333.svg?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" />
  <img src="https://img.shields.io/badge/React%20Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/WebRTC-333333.svg?style=for-the-badge&logo=WebRTC&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/PeerJS-00A9E0?style=for-the-badge&logo=webrtc&logoColor=white" alt="PeerJS" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
  
  <br/><br/>
  <h3>Backend & Database</h3>
  <img src="https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=python&logoColor=white" alt="SQLAlchemy" />
  <img src="https://img.shields.io/badge/PostgreSQL-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres" />
  <img src="https://img.shields.io/badge/pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="pgvector" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=maildotru&logoColor=white" alt="Resend" />

  <br/><br/>
  <h3>AI & Infrastructure</h3>
  <img src="https://img.shields.io/badge/Docker-2496ED.svg?style=for-the-badge&logo=Docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/OpenAI-412991.svg?style=for-the-badge&logo=OpenAI&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Groq-00A45B?style=for-the-badge&logo=google&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" />
</div>

## Platform Overview

![HealthHub AI Landing Page](./frontend/public/images/landing-preview.png)

HealthHub AI is an AI-powered medical triage and telehealth platform designed to accurately evaluate patient symptoms and connect them with verified specialists.

### 🚀 Key Capabilities & Achievements

- **Architecture & Full-Stack:** Engineered a scalable platform using React, FastAPI, and PostgreSQL, featuring **30+ RESTful API endpoints** for robust patient-doctor workflows.
- **AI & Vector Search:** Architected a Retrieval-Augmented Generation (RAG) system with `pgvector`, embedding **50,000+ medical knowledge chunks** to achieve **<200ms semantic search latency** for real-time symptom triage.
- **Intelligent Triage Engine:** Developed an advanced NLP pipeline utilizing LLMs (Groq/Gemini/OpenAI) to extract symptoms, detect emergency red flags, and calculate automated medical risk assessments.
- **Real-Time Telehealth:** Integrated end-to-end encrypted WebRTC video consultations with PeerJS, ensuring secure, HIPAA-compliant telehealth appointments.
- **Infrastructure & Deployment:** Streamlined application delivery by **fully containerizing** the architecture with Docker and Docker Compose, reducing local setup time and ensuring environment consistency.
- **Enterprise Security:** Implemented robust security using JWT authentication and Role-Based Access Control (RBAC) to securely manage Patient, Doctor, and Admin interfaces.

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
  - **Admin Access:** You can log in using `admin@healthhub.ai` and `admin123` to access the Admin Panel to approve doctor applications.
- **Backend API Docs:** The FastAPI interactive documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).
- **Database Access:** The PostgreSQL database is mapped to your local port `5433` (to avoid conflicts with local installations). You can connect via pgAdmin using `localhost:5433`, user `postgres`, password `password`, and database `healthhub`.

---

[![Author](https://img.shields.io/badge/Author-Nigam%20Vaghani-4F46E5?style=for-the-badge)](https://github.com/Nigam-Vaghani)
[![Author](https://img.shields.io/badge/Author-Mili%20Kava-E546B4?style=for-the-badge)](https://github.com/MiliKava)


project is in development phase, stay tuned.
