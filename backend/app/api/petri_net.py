from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
import uuid
from ..services.pm4py_service import PM4PyService
from ..models.petri_net import UploadResponse, ErrorResponse, PetriNetData

router = APIRouter(prefix="/api", tags=["petri-net"])

# In-memory storage for demo purposes
# In production, you might want to use a database
petri_nets: Dict[str, PetriNetData] = {}

# Service instance
pm4py_service = PM4PyService()

@router.post("/upload-pnml", response_model=UploadResponse)
async def upload_pnml(file: UploadFile = File(...)):
    """Upload and parse a PNML file"""
    try:
        # Validate file type
        if not file.filename.endswith('.pnml'):
            raise HTTPException(
                status_code=400, 
                detail="File must be a PNML file (.pnml extension)"
            )
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(
                status_code=400,
                detail="File is empty"
            )
        
        # Parse with PM4Py
        petri_net_data = pm4py_service.parse_pnml_file(file_content, file.filename)
        
        # Generate unique ID and store
        petri_net_id = str(uuid.uuid4())
        petri_nets[petri_net_id] = petri_net_data
        
        return UploadResponse(
            success=True,
            message=f"Successfully parsed PNML file: {file.filename}",
            petri_net_id=petri_net_id,
            data=petri_net_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                success=False,
                message=f"Failed to process PNML file: {str(e)}",
                error_type="parsing_error"
            ).dict()
        )

@router.get("/petri-net/{petri_net_id}", response_model=PetriNetData)
async def get_petri_net(petri_net_id: str):
    """Get a parsed Petri net by ID"""
    if petri_net_id not in petri_nets:
        raise HTTPException(
            status_code=404,
            detail="Petri net not found"
        )
    
    return petri_nets[petri_net_id]

@router.get("/statistics/{petri_net_id}")
async def get_statistics(petri_net_id: str):
    """Get statistics for a Petri net"""
    if petri_net_id not in petri_nets:
        raise HTTPException(
            status_code=404,
            detail="Petri net not found"
        )
    
    return petri_nets[petri_net_id].statistics

@router.delete("/petri-net/{petri_net_id}")
async def delete_petri_net(petri_net_id: str):
    """Delete a Petri net from memory"""
    if petri_net_id not in petri_nets:
        raise HTTPException(
            status_code=404,
            detail="Petri net not found"
        )
    
    del petri_nets[petri_net_id]
    return {"success": True, "message": "Petri net deleted successfully"}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Petri Net API",
        "stored_nets": len(petri_nets)
    } 