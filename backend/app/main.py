from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .api.petri_net import router as petri_net_router

# Create FastAPI app
app = FastAPI(
    title="Petri Net API",
    description="Backend API for Petri Net visualization using PM4Py",
    version="1.0.0"
)

# Configure CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(petri_net_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Petri Net API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error_type": "server_error"
        }
    ) 