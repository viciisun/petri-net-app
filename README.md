# Petri Net Visualizer

A modern web application for visualizing Petri nets with a React frontend and Python backend using PM4Py.

## Architecture

- **Frontend**: React + Vite + React Flow + Zustand
- **Backend**: Python + FastAPI + PM4Py
- **Visualization**: React Flow with Dagre/Elkjs layouts

## Features

- 📁 PNML file upload and parsing with PM4Py
- 🎨 Interactive Petri net visualization
- 📊 Comprehensive network statistics
- 🔄 Multiple layout algorithms (Dagre, Elkjs)
- 📱 Responsive design
- 🚀 Fast API with automatic documentation

## Quick Start

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies (using miniforge base environment):

```bash
pip install -r requirements.txt
```

3. Run the backend server:

```bash
python run.py
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Development

### Running Both Servers

You need to run both backend and frontend servers simultaneously:

**Terminal 1 (Backend):**

```bash
cd backend && python run.py
```

**Terminal 2 (Frontend):**

```bash
cd frontend && npm run dev
```

### API Documentation

When the backend is running, visit:

- Interactive API docs: `http://localhost:8000/docs`
- OpenAPI specification: `http://localhost:8000/openapi.json`

## API Endpoints

- `POST /api/upload-pnml` - Upload and parse PNML file
- `GET /api/petri-net/{id}` - Get parsed Petri net data
- `GET /api/statistics/{id}` - Get network statistics
- `GET /api/health` - Health check

## Sample Files

The project includes sample PNML files in `frontend/public/`:

- `sample.pnml` - Simple Petri net
- `complex-sample.pnml` - Complex business process

## Technology Stack

### Backend

- **FastAPI** - Modern Python web framework
- **PM4Py** - Process mining library for PNML parsing
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend

- **React** - UI framework
- **Vite** - Build tool
- **React Flow** - Graph visualization
- **Zustand** - State management
- **Dagre/Elkjs** - Layout algorithms

## Project Structure

```
petri-net-app/
├── backend/           # Python FastAPI backend
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── models/    # Pydantic models
│   │   ├── services/  # Business logic
│   │   └── main.py    # FastAPI app
│   ├── requirements.txt
│   └── run.py
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── public/
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## License

MIT License
