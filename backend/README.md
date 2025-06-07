# Petri Net Backend API

FastAPI backend for Petri Net visualization using PM4Py.

## Setup

1. Install dependencies (using miniforge base environment):

```bash
pip install -r requirements.txt
```

2. Run the server:

```bash
python run.py
```

The API will be available at `http://localhost:8000`

## API Documentation

- Interactive docs: `http://localhost:8000/docs`
- OpenAPI spec: `http://localhost:8000/openapi.json`

## Endpoints

- `POST /api/upload-pnml` - Upload and parse PNML file
- `GET /api/petri-net/{id}` - Get parsed Petri net data
- `GET /api/statistics/{id}` - Get network statistics
- `GET /api/health` - Health check
