from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Form
from fastapi.responses import JSONResponse, Response, FileResponse
from typing import Dict, Any, Optional, List
import uuid
import tempfile
import os
import pandas as pd
import pm4py
from ..services.pm4py_service import PM4PyService
from ..models.petri_net import UploadResponse, ErrorResponse, PetriNetData, NodeData, EdgeData
from ..services.petri_net_service import PetriNetService
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["petri-net"])

# Global storage for Petri nets (in production, use a database)
petri_nets: Dict[str, Dict[str, Any]] = {}
pm4py_service = PM4PyService()

class EventLogImportConfig(BaseModel):
    """Event Log import configuration"""
    case_id_column: str
    activity_column: str
    timestamp_column: str
    resource_column: Optional[str] = None
    algorithm: str = "inductive"  # inductive, alpha, heuristics
    noise_threshold: float = 0.0
    dependency_threshold: float = 0.5
    and_threshold: float = 0.65

class EventLogPreview(BaseModel):
    """Event Log preview data"""
    columns: List[str]
    sample_data: List[Dict[str, Any]]
    total_rows: int
    data_types: Dict[str, str]
    statistics: Dict[str, Any]

@router.post("/upload-pnml", response_model=UploadResponse)
async def upload_pnml(file: UploadFile = File(...)):
    """Upload and parse a PNML or APNML file"""
    try:
        # Validate file type - support both .pnml and .apnml
        if not (file.filename.endswith('.pnml') or file.filename.endswith('.apnml')):
            raise HTTPException(
                status_code=400, 
                detail="File must be a PNML file (.pnml extension) or APNML file (.apnml extension)"
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
        
        # Determine file type for message
        file_type = "APNML" if file.filename.endswith('.apnml') else "PNML"
        
        return UploadResponse(
            success=True,
            message=f"Successfully parsed {file_type} file: {file.filename}",
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
                message=f"Failed to process PNML/APNML file: {str(e)}",
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

@router.post("/export-pnml")
async def export_pnml(request: Request):
    """Export current Petri net state to PNML format"""
    try:
        # Get the request body (PetriNetData)
        body = await request.json()
        
        # Convert to PetriNetData object
        petri_net_data = PetriNetData(**body)
        
        # Export to PNML string
        pnml_content = pm4py_service.export_to_pnml_string(petri_net_data)
        
        # Generate filename
        network_name = petri_net_data.networkName or petri_net_data.networkId or "petri_net"
        filename = f"{network_name}.pnml"
        
        # Return as downloadable file
        return Response(
            content=pnml_content,
            media_type="application/xml",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/xml; charset=utf-8"
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                success=False,
                message=f"Failed to export PNML: {str(e)}",
                error_type="export_error"
            ).dict()
        )

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Petri Net API",
        "stored_nets": len(petri_nets)
    }

@router.post("/preview-event-log", response_model=EventLogPreview)
async def preview_event_log(file: UploadFile = File(...)):
    """Preview Event Log CSV file, return column information and data samples"""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Read CSV file
        contents = await file.read()
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.csv') as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        try:
            # Use pandas to read CSV
            df = pd.read_csv(temp_file_path)
            
            # Basic statistics
            statistics = {
                "unique_values_per_column": {},
                "null_counts": {},
                "potential_case_id_columns": [],
                "potential_activity_columns": [],
                "potential_timestamp_columns": []
            }
            
            # Analyze characteristics of each column
            for col in df.columns:
                unique_count = df[col].nunique()
                null_count = df[col].isnull().sum()
                
                statistics["unique_values_per_column"][col] = unique_count
                statistics["null_counts"][col] = int(null_count)
                
                # Infer possible column types
                col_lower = col.lower()
                
                # Case ID candidate columns (usually have many unique values but not the most)
                if any(keyword in col_lower for keyword in ['id', 'case', 'people', 'customer', 'patient']):
                    statistics["potential_case_id_columns"].append(col)
                
                # Activity candidate columns
                if any(keyword in col_lower for keyword in ['activity', 'concept:name', 'event', 'task', 'action']):
                    statistics["potential_activity_columns"].append(col)
                
                # Timestamp candidate columns
                if any(keyword in col_lower for keyword in ['time', 'date', 'timestamp', 'datetime']):
                    statistics["potential_timestamp_columns"].append(col)
            
            # If no clear candidate columns, infer based on data characteristics
            if not statistics["potential_case_id_columns"]:
                # Case ID usually has moderate number of unique values
                total_rows = len(df)
                for col in df.columns:
                    unique_ratio = df[col].nunique() / total_rows
                    if 0.1 <= unique_ratio <= 0.8:  # 10%-80% unique ratio
                        statistics["potential_case_id_columns"].append(col)
            
            if not statistics["potential_activity_columns"]:
                # Activity usually has fewer unique values (limited activity types)
                for col in df.columns:
                    unique_count = df[col].nunique()
                    if 2 <= unique_count <= 50:  # 2-50 different activities
                        statistics["potential_activity_columns"].append(col)
            
            return EventLogPreview(
                columns=list(df.columns),
                sample_data=df.head(10).to_dict('records'),
                total_rows=len(df),
                data_types={col: str(dtype) for col, dtype in df.dtypes.items()},
                statistics=statistics
            )
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/import-event-log")
async def import_event_log(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    """Import Event Log using specified configuration and generate Petri net"""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Parse configuration
        import json
        try:
            config_dict = json.loads(config)
            config_obj = EventLogImportConfig(**config_dict)
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid config format: {str(e)}")
        
        # Read file content
        contents = await file.read()
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.csv') as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        try:
            # Use pandas to read CSV, then format with PM4Py
            df = pd.read_csv(temp_file_path)
            
            # Format DataFrame to PM4Py format
            log_df = pm4py.format_dataframe(df,
                                          case_id=config_obj.case_id_column,
                                          activity_key=config_obj.activity_column,
                                          timestamp_key=config_obj.timestamp_column)
            
            # Discover Petri net based on selected algorithm
            if config_obj.algorithm == "inductive":
                net, initial_marking, final_marking = pm4py.discover_petri_net_inductive(
                    log_df, noise_threshold=config_obj.noise_threshold
                )
            elif config_obj.algorithm == "alpha":
                net, initial_marking, final_marking = pm4py.discover_petri_net_alpha(log_df)
            elif config_obj.algorithm == "heuristics":
                net, initial_marking, final_marking = pm4py.discover_petri_net_heuristics(
                    log_df,
                    dependency_threshold=config_obj.dependency_threshold,
                    and_threshold=config_obj.and_threshold
                )
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {config_obj.algorithm}")
            
            # Convert to frontend format
            petri_net_service = PetriNetService()
            petri_net_data = petri_net_service.convert_pm4py_to_frontend(
                net, initial_marking, final_marking
            )
            
            # Add some metadata
            petri_net_data.networkName = f"Discovered from {file.filename}"
            petri_net_data.metadata = {
                "source": "event_log_import",
                "algorithm": config_obj.algorithm,
                "original_filename": file.filename,
                "case_id_column": config_obj.case_id_column,
                "activity_column": config_obj.activity_column,
                "timestamp_column": config_obj.timestamp_column,
                "total_traces": log_df['case:concept:name'].nunique(),
                "total_events": len(log_df),
                "unique_activities": log_df['concept:name'].nunique()
            }
            
            return {
                "success": True,
                "message": f"Successfully imported Event Log with {config_obj.algorithm} algorithm",
                "petri_net": petri_net_data.dict(),
                "statistics": {
                    "total_traces": petri_net_data.metadata["total_traces"],
                    "total_events": petri_net_data.metadata["total_events"],
                    "unique_activities": petri_net_data.metadata["unique_activities"],
                    "places_count": len(petri_net_data.nodes),
                    "transitions_count": len([n for n in petri_net_data.nodes if n.type == "transition"]),
                    "edges_count": len(petri_net_data.edges)
                }
            }
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing Event Log: {str(e)}")

@router.post("/export-event-log")
async def export_event_log(request: Request):
    """Export current Petri net state to Event Log CSV format"""
    try:
        # Get the request body (PetriNetData)
        body = await request.json()
        
        # Convert to PetriNetData object
        petri_net_data = PetriNetData(**body)
        
        # Get optional configuration
        config = body.get('config', {})
        
        # Export to Event Log CSV
        csv_content = pm4py_service.export_to_event_log(petri_net_data, config)
        
        # Generate filename
        network_name = petri_net_data.networkName or petri_net_data.networkId or "petri_net"
        filename = f"{network_name}_event_log.csv"
        
        # Return as downloadable file
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                success=False,
                message=f"Failed to export Event Log: {str(e)}",
                error_type="export_error"
            ).dict()
        ) 