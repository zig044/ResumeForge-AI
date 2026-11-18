# ResumeForge AI

**Build a resume that reflects your actual work.**

An AI-assisted resume builder designed to make writing, formatting, and exporting a professional resume simpler.

Built with React, TypeScript, FastAPI, and Google Gemini.

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776ab?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-Not%20specified-lightgrey)

---

## About the project

Writing a resume can be surprisingly time-consuming, especially when you're trying to keep the content concise and the formatting consistent.

I built ResumeForge AI to make that process easier.

The application provides a guided editor where users can enter their details, see a live preview, and export their resume as a PDF. It also integrates Google Gemini to help improve the wording of project descriptions without deliberately adding achievements or technologies that weren't mentioned.

The focus is on presenting genuine experience clearly rather than filling a resume with unnecessary buzzwords.

## Features

- **Guided resume builder:** Create sections for personal details, professional summary, experience, projects, education, technical skills, and certifications.
- **Live preview:** See changes immediately while editing.
- **Two resume templates:** Switch between Modern and Classic layouts.
- **Gemini AI assistance:** Improve the wording of individual project descriptions and review suggestions before applying them.
- **Browser autosave:** Keep resume details in local storage while working.
- **JSON backup:** Download a copy of your resume data.
- **PDF export:** Save the completed resume through the browser's print-to-PDF feature.
- **Resume completeness indicator:** Check whether essential sections have been filled in.
- **Basic ATS validation API:** Check resume sections, contact information, and selected keywords against a job description using the FastAPI endpoint.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, CSS |
| Backend | Python, FastAPI, Pydantic |
| AI integration | Google Gemini API |
| Data storage | Browser localStorage |
| PDF generation | Browser print-to-PDF |
| API testing | Swagger UI |

## Project structure

```text
ResumeForge-AI/
├── backend/
│   ├── app/
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
└── .gitignore
```

## Getting started

### Requirements

- Python
- Node.js and npm
- Git
- A Google Gemini API key for AI-powered rewriting

### 1. Clone the repository

```bash
git clone https://github.com/zig044/ResumeForge-AI.git
cd ResumeForge-AI
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
GEMINI_API_KEY=your_api_key_here
```

Start the backend:

```bash
python -m uvicorn app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

Swagger documentation: `http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open another terminal from the project root:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` in your browser.

Keep the frontend and backend running together to use AI-powered rewriting.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend status |
| GET | `/health` | Health check |
| POST | `/ai/improve` | Improve a project description using Gemini |
| POST | `/ats/validate` | Run basic resume validation |

### Example AI request

```json
{
  "description": "Built a backend using FastAPI to process road images and detect potholes using YOLO."
}
```

The API returns an improved description for the user to review.

## How the application works

1. Users enter their information through the React interface.
2. The application updates the resume preview as information changes.
3. Draft data is saved locally in the browser.
4. When users request an AI improvement, the selected project description is sent to the FastAPI backend.
5. FastAPI communicates with Google Gemini and returns a suggested rewrite.
6. Users can accept or discard the suggestion.
7. The finished resume can be exported as a PDF.

## ATS compatibility

ResumeForge AI uses straightforward resume layouts with standard section headings.

The backend also includes a basic ATS validation endpoint that checks for missing sections, contact details, and selected job-related technical keywords.

These checks are intended as guidance. They do not guarantee compatibility with every applicant tracking system or predict an employer's hiring decision.

The ATS validation endpoint is currently available through Swagger UI and has not yet been integrated into the React interface.

## Privacy and security

- Resume drafts are stored in the user's browser.
- The application does not currently use a user-account database.
- Only descriptions explicitly submitted for AI improvement are sent to the Gemini-powered backend.
- The Gemini API key is configured on the backend through environment variables.
- Basic AI request limits are implemented to reduce excessive usage.

Users should review AI-generated suggestions for accuracy and avoid submitting sensitive information unnecessarily.

## Current status

The frontend and backend have been developed and tested locally.

Public deployment is the next stage. Production API routing, hosting configuration, and final live testing are still pending.

## Future improvements

- [ ] Deploy the frontend and backend
- [ ] Integrate ATS validation into the resume editor
- [ ] Add screenshots of the application
- [ ] Improve automated testing
- [ ] Expand resume customization options based on user feedback

## Author

Developed by [zig044](https://github.com/zig044).

GitHub: [github.com/zig044](https://github.com/zig044)

---

*ResumeForge AI — Write clearly. Present your work confidently.*
