# Clean Project Structure

## Overview

React frontend + Python backend architecture for Petri net visualization.

## Directory Structure

```
petri-net-app/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   └── petri_net.py    # API endpoints
│   │   ├── models/
│   │   │   └── petri_net.py    # Pydantic models
│   │   ├── services/
│   │   │   └── pm4py_service.py # PM4Py integration
│   │   └── main.py             # FastAPI app
│   ├── requirements.txt        # Python dependencies
│   └── run.py                  # Server startup script
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/
│   │   │   ├── apiService.js      # Backend API client
│   │   │   └── TransformationService.js # Layout algorithms
│   │   ├── store/
│   │   │   └── petriNetStore.js   # Zustand state management
│   │   └── types/
│   │       └── index.js           # Type definitions
│   ├── public/                 # Static files & sample PNML
│   └── package.json           # Node dependencies
└── README.md                  # Main documentation
```

## Key Components

### Backend

- **FastAPI**: Modern Python web framework
- **PM4Py**: PNML parsing and Petri net analysis
- **Pydantic**: Data validation and serialization

### Frontend

- **React + Vite**: Modern frontend framework
- **React Flow**: Graph visualization
- **Zustand**: Lightweight state management
- **Dagre/Elkjs**: Layout algorithms

## Removed Components

- ❌ Virtual environment setup (using miniforge base)
- ❌ PM4JS client-side parsing
- ❌ Custom PNML parser
- ❌ FileImportService
- ❌ Startup scripts
- ❌ Old dist/ directory

## Running the Application

**Backend (Terminal 1):**

```bash
cd backend && python run.py
```

**Frontend (Terminal 2):**

```bash
cd frontend && npm run dev
```

## API Endpoints

- `POST /api/upload-pnml` - Upload PNML file
- `GET /api/petri-net/{id}` - Get parsed data
- `GET /api/statistics/{id}` - Get statistics
- `GET /api/health` - Health check
