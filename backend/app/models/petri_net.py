from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class Position(BaseModel):
    x: float
    y: float

class NodeData(BaseModel):
    label: str
    name: str
    type: str
    tokens: Optional[int] = None
    isInitialMarking: Optional[bool] = False
    isFinalMarking: Optional[bool] = False
    isInvisible: Optional[bool] = False
    attachPoints: Optional[int] = 4  # Default 4 attach points (top, right, bottom, left)

class Node(BaseModel):
    id: str
    type: str
    position: Position
    data: NodeData

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    weight: Optional[int] = 1  # Default weight is 1

class PetriNetData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    statistics: Dict[str, Any]
    networkId: Optional[str] = None
    networkName: Optional[str] = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    petri_net_id: Optional[str] = None
    data: Optional[PetriNetData] = None

class ErrorResponse(BaseModel):
    success: bool
    message: str
    error_type: str 