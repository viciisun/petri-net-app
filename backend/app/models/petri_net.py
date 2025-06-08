from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class Position(BaseModel):
    x: float
    y: float

class NodeData(BaseModel):
    id: str
    type: str  # 'place' or 'transition'
    label: str
    name: str
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

class EdgeData(BaseModel):
    weight: Optional[int] = 1

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    markerEnd: Optional[Dict[str, str]] = None
    style: Optional[Dict[str, str]] = None
    data: Optional[EdgeData] = None

class PetriNetData(BaseModel):
    networkId: Optional[str] = None
    networkName: Optional[str] = None
    nodes: List[Node]
    edges: List[Edge]
    statistics: Dict[str, Any]
    selectedElement: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    petri_net_id: Optional[str] = None
    data: Optional[PetriNetData] = None

class ErrorResponse(BaseModel):
    success: bool
    message: str
    error_type: str 