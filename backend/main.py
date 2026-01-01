from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
import uvicorn
from database import get_db, create_tables, State, TransmissionLine, TrippingIncident, TowerLocation, MaintenanceOffice, User
from pydantic import BaseModel
from ai_models.predictive_maintenance import PredictiveMaintenanceModel
from ai_models.chatbot import PowerGridChatbot


# Import auth
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_active_user,
    require_admin,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Create FastAPI app
app = FastAPI(title="PowerGrid T-LAMP API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== PYDANTIC MODELS ====================

class UserCreate(BaseModel):
    email: str
    username: str
    full_name: str
    designation: str
    department: str
    password: str
    role: str = "user"

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    designation: str
    department: str
    role: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

class TransmissionLineCreate(BaseModel):
    name: str
    voltage_level: str
    total_length_km: float
    commission_date: date
    state_id: int
    maintenance_office_id: int
    status: str = "Active"
    remarks: Optional[str] = None

class TransmissionLineResponse(BaseModel):
    id: int
    name: str
    voltage_level: str
    total_length_km: float
    commission_date: date
    state_id: int
    state_name: str
    maintenance_office_id: int
    maintenance_office_name: str
    status: str
    remarks: Optional[str]

class TowerLocationCreate(BaseModel):
    line_id: int
    tower_number: str
    latitude: float
    longitude: float
    foundation_type: str
    tower_type: str
    height_meters: float
    installation_date: date
    last_inspection_date: Optional[date] = None
    condition: str = "Good"
    remarks: Optional[str] = None

class TowerLocationResponse(BaseModel):
    id: int
    line_id: int
    line_name: str
    voltage_level: str
    tower_number: str
    latitude: float
    longitude: float
    foundation_type: str
    tower_type: str
    height_meters: float
    installation_date: date
    last_inspection_date: Optional[date]
    condition: str
    remarks: Optional[str]

class TrippingIncidentCreate(BaseModel):
    line_id: int
    fault_date: date
    fault_time: str
    fault_type: str
    fault_location: str
    affected_phases: str
    restoration_time: Optional[str] = None
    downtime_minutes: int
    attributed_to_powergrid: str = "YES"
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    remarks: Optional[str] = None

class TrippingIncidentResponse(BaseModel):
    id: int
    line_id: int
    line_name: str
    voltage_level: str
    fault_date: date
    fault_time: str
    fault_type: str
    fault_location: str
    affected_phases: str
    restoration_time: Optional[str]
    downtime_minutes: int
    attributed_to_powergrid: str
    root_cause: Optional[str]
    corrective_action: Optional[str]
    remarks: Optional[str]

class ChatMessage(BaseModel):
    message: str

# ==================== STARTUP ====================

@app.on_event("startup")
def startup_event():
    create_tables()

@app.get("/")
def read_root():
    return {"message": "PowerGrid T-LAMP API is running", "status": "connected"}

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        designation=user.designation,
        department=user.department,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        designation=new_user.designation,
        department=new_user.department,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@app.post("/api/auth/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    print(f"Login attempt - Email: {login_data.email}")  # Debug log
    
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        print(f"User not found: {login_data.email}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"User found: {user.email}")  # Debug log
    password_valid = verify_password(login_data.password, user.hashed_password)
    print(f"Password valid: {password_valid}")  # Debug log
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            designation=user.designation,
            department=user.department,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )
@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Get current logged-in user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        designation=current_user.designation,
        department=current_user.department,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@app.post("/api/auth/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    """Logout user"""
    return {"message": "Successfully logged out"}

# ==================== DASHBOARD ENDPOINT ====================

@app.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    total_lines = db.query(TransmissionLine).count()
    total_towers = db.query(TowerLocation).count()
    total_incidents = db.query(TrippingIncident).count()
    total_km = db.query(func.sum(TransmissionLine.total_length_km)).scalar() or 0
    
    thirty_days_ago = datetime.now().date() - timedelta(days=30)
    recent_incidents = db.query(TrippingIncident).filter(
        TrippingIncident.fault_date >= thirty_days_ago
    ).count()
    
    pg_attributed = db.query(TrippingIncident).filter(
        TrippingIncident.attributed_to_powergrid == "YES"
    ).count()
    
    # FIX: Include km in voltage breakdown
    incidents_by_voltage = db.query(
        TransmissionLine.voltage_level,
        func.count(TrippingIncident.id).label('count'),
        func.sum(TransmissionLine.total_length_km).label('km')  # Add this
    ).join(
        TrippingIncident,
        TransmissionLine.id == TrippingIncident.transmission_line_id
    ).group_by(
        TransmissionLine.voltage_level
    ).all()
    
    voltage_data = [
        {
            "voltage": v[0], 
            "count": v[1],
            "km": round(v[2] or 0, 2)  # Add km to response
        } 
        for v in incidents_by_voltage
    ]
    
    incidents_by_fault = db.query(
        TrippingIncident.fault_type,
        func.count(TrippingIncident.id).label('count')
    ).group_by(
        TrippingIncident.fault_type
    ).all()
    
    fault_data = [{"type": f[0], "count": f[1]} for f in incidents_by_fault]
    
    six_months_ago = datetime.now().date() - timedelta(days=180)
    monthly_incidents = db.query(
        func.strftime('%Y-%m', TrippingIncident.fault_date).label('month'),
        func.count(TrippingIncident.id).label('count')
    ).filter(
        TrippingIncident.fault_date >= six_months_ago
    ).group_by('month').order_by('month').all()
    
    monthly_data = [{"month": m[0], "count": m[1]} for m in monthly_incidents]
    
    return {
        "total_lines": total_lines,
        "total_towers": total_towers,
        "total_incidents": total_incidents,
        "total_km": round(total_km, 2),
        "recent_incidents": recent_incidents,
        "pg_attributed": pg_attributed,
        "voltage_breakdown": voltage_data,  # Now includes km
        "fault_breakdown": fault_data,
        "monthly_trend": monthly_data
    }

# ==================== TRANSMISSION LINES ====================

@app.get("/transmission-lines/", response_model=List[TransmissionLineResponse])
async def get_transmission_lines(
    voltage_level: Optional[str] = None,
    state_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(TransmissionLine).join(State).join(MaintenanceOffice)
    
    if voltage_level:
        query = query.filter(TransmissionLine.voltage_level == voltage_level)
    if state_id:
        query = query.filter(TransmissionLine.state_id == state_id)
    if status:
        query = query.filter(TransmissionLine.status == status)
    
    lines = query.all()
    
    return [
        TransmissionLineResponse(
            id=line.id,
            name=line.line_name,
            voltage_level=line.voltage_level,
            total_length_km=line.total_length_km,
            commission_date=line.commission_date,
            state_id=line.state_id,
            state_name=line.state.name,
            maintenance_office_id=line.maintenance_office_id,
            maintenance_office_name=line.maintenance_office.name,
            status=line.status,
            remarks=line.remarks
        ) for line in lines
    ]

@app.get("/transmission-lines/ids")
async def get_transmission_line_ids(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all transmission line IDs and names for dropdowns"""
    lines = db.query(TransmissionLine.id, TransmissionLine.line_name).all()
    return [{"id": line.id, "name": line.line_name} for line in lines]

@app.post("/transmission-lines/", response_model=TransmissionLineResponse)
async def create_transmission_line(
    line: TransmissionLineCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can create transmission lines")
    
    state = db.query(State).filter(State.id == line.state_id).first()
    if not state:
        raise HTTPException(status_code=400, detail="State not found")
    
    office = db.query(MaintenanceOffice).filter(MaintenanceOffice.id == line.maintenance_office_id).first()
    if not office:
        raise HTTPException(status_code=400, detail="Maintenance office not found")
    
    db_line = TransmissionLine(
        line_name=line.name,
        voltage_level=line.voltage_level,
        total_length_km=line.total_length_km,
        commission_date=line.commission_date,
        state_id=line.state_id,
        maintenance_office_id=line.maintenance_office_id,
        status=line.status,
        remarks=line.remarks
    )
    db.add(db_line)
    db.commit()
    db.refresh(db_line)
    
    return TransmissionLineResponse(
        id=db_line.id,
        name=db_line.line_name,
        voltage_level=db_line.voltage_level,
        total_length_km=db_line.total_length_km,
        commission_date=db_line.commission_date,
        state_id=db_line.state_id,
        state_name=db_line.state.name,
        maintenance_office_id=db_line.maintenance_office_id,
        maintenance_office_name=db_line.maintenance_office.name,
        status=db_line.status,
        remarks=db_line.remarks
    )

@app.put("/transmission-lines/{line_id}", response_model=TransmissionLineResponse)
async def update_transmission_line(
    line_id: int,
    line: TransmissionLineCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can update transmission lines")
    
    db_line = db.query(TransmissionLine).filter(TransmissionLine.id == line_id).first()
    if not db_line:
        raise HTTPException(status_code=404, detail="Transmission line not found")
    
    db_line.line_name = line.name
    db_line.voltage_level = line.voltage_level
    db_line.total_length_km = line.total_length_km
    db_line.commission_date = line.commission_date
    db_line.state_id = line.state_id
    db_line.maintenance_office_id = line.maintenance_office_id
    db_line.status = line.status
    db_line.remarks = line.remarks
    
    db.commit()
    db.refresh(db_line)
    
    return TransmissionLineResponse(
        id=db_line.id,
        name=db_line.line_name,
        voltage_level=db_line.voltage_level,
        total_length_km=db_line.total_length_km,
        commission_date=db_line.commission_date,
        state_id=db_line.state_id,
        state_name=db_line.state.name,
        maintenance_office_id=db_line.maintenance_office_id,
        maintenance_office_name=db_line.maintenance_office.name,
        status=db_line.status,
        remarks=db_line.remarks
    )

@app.delete("/transmission-lines/{line_id}")
async def delete_transmission_line(
    line_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can delete transmission lines")
    
    db_line = db.query(TransmissionLine).filter(TransmissionLine.id == line_id).first()
    if not db_line:
        raise HTTPException(status_code=404, detail="Transmission line not found")
    
    db.delete(db_line)
    db.commit()
    return {"message": "Transmission line deleted successfully"}

# ==================== TOWER LOCATIONS ====================

@app.get("/tower-locations/")
def get_tower_locations(
    transmission_line_id: Optional[int] = None,
    condition: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all tower locations with optional filters"""
    try:
        query = db.query(TowerLocation)
        
        if transmission_line_id:
            query = query.filter(TowerLocation.transmission_line_id == transmission_line_id)
        if condition:
            query = query.filter(TowerLocation.condition == condition)
        
        towers = query.all()
        
        # Manually fetch line info for each tower
        result = []
        for tower in towers:
            # Get the transmission line
            line = db.query(TransmissionLine).filter(TransmissionLine.id == tower.transmission_line_id).first()
            
            # Get the state
            state = None
            if line and line.state_id:
                state = db.query(State).filter(State.id == line.state_id).first()
            
            result.append({
                "id": tower.id,
                "transmission_line_id": tower.transmission_line_id,
                "tower_number": tower.tower_number,
                "latitude": tower.latitude,
                "longitude": tower.longitude,
                "height_meters": tower.height_meters,
                "tower_type": tower.tower_type,
                "foundation_type": tower.foundation_type,
                "condition": tower.condition,
                "installation_date": str(tower.installation_date) if tower.installation_date else None,
                "last_inspection_date": str(tower.last_inspection_date) if tower.last_inspection_date else None,
                "remarks": tower.remarks,
                "line_name": line.line_name if line else None,
                "voltage_level": line.voltage_level if line else None,
                "state_name": state.name if state else None,  # CHANGED to .name (not .state_name)
            })
        
        return result
        
    except Exception as e:
        print(f"Error in get_tower_locations: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

 
    

@app.post("/tower-locations/", response_model=TowerLocationResponse)
async def create_tower_location(
    tower: TowerLocationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can create tower locations")
    
    line = db.query(TransmissionLine).filter(TransmissionLine.id == tower.line_id).first()
    if not line:
        raise HTTPException(status_code=400, detail="Transmission line not found")
    
    db_tower = TowerLocation(
        transmission_line_id=tower.line_id,
        tower_number=tower.tower_number,
        latitude=tower.latitude,
        longitude=tower.longitude,
        foundation_type=tower.foundation_type,
        tower_type=tower.tower_type,
        height_meters=tower.height_meters,
        installation_date=tower.installation_date,
        last_inspection_date=tower.last_inspection_date,
        condition=tower.condition,
        remarks=tower.remarks
    )
    db.add(db_tower)
    db.commit()
    db.refresh(db_tower)
    
    return TowerLocationResponse(
        id=db_tower.id,
        line_id=db_tower.transmission_line_id,
        line_name=db_tower.transmission_line.line_name,
        voltage_level=db_tower.transmission_line.voltage_level,
        tower_number=db_tower.tower_number,
        latitude=db_tower.latitude,
        longitude=db_tower.longitude,
        foundation_type=db_tower.foundation_type,
        tower_type=db_tower.tower_type,
        height_meters=db_tower.height_meters,
        installation_date=db_tower.installation_date,
        last_inspection_date=db_tower.last_inspection_date,
        condition=db_tower.condition,
        remarks=db_tower.remarks
    )

@app.put("/tower-locations/{tower_id}", response_model=TowerLocationResponse)
async def update_tower_location(
    tower_id: int,
    tower: TowerLocationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can update tower locations")
    
    db_tower = db.query(TowerLocation).filter(TowerLocation.id == tower_id).first()
    if not db_tower:
        raise HTTPException(status_code=404, detail="Tower location not found")
    
    db_tower.transmission_line_id = tower.line_id
    db_tower.tower_number = tower.tower_number
    db_tower.latitude = tower.latitude
    db_tower.longitude = tower.longitude
    db_tower.foundation_type = tower.foundation_type
    db_tower.tower_type = tower.tower_type
    db_tower.height_meters = tower.height_meters
    db_tower.installation_date = tower.installation_date
    db_tower.last_inspection_date = tower.last_inspection_date
    db_tower.condition = tower.condition
    db_tower.remarks = tower.remarks
    
    db.commit()
    db.refresh(db_tower)
    
    return TowerLocationResponse(
        id=db_tower.id,
        line_id=db_tower.transmission_line_id,
        line_name=db_tower.transmission_line.line_name,
        voltage_level=db_tower.transmission_line.voltage_level,
        tower_number=db_tower.tower_number,
        latitude=db_tower.latitude,
        longitude=db_tower.longitude,
        foundation_type=db_tower.foundation_type,
        tower_type=db_tower.tower_type,
        height_meters=db_tower.height_meters,
        installation_date=db_tower.installation_date,
        last_inspection_date=db_tower.last_inspection_date,
        condition=db_tower.condition,
        remarks=db_tower.remarks
    )

@app.delete("/tower-locations/{tower_id}")
async def delete_tower_location(
    tower_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can delete tower locations")
    
    db_tower = db.query(TowerLocation).filter(TowerLocation.id == tower_id).first()
    if not db_tower:
        raise HTTPException(status_code=404, detail="Tower location not found")
    
    db.delete(db_tower)
    db.commit()
    return {"message": "Tower location deleted successfully"}

# ==================== TRIPPING INCIDENTS ====================

@app.get("/tripping-incidents/", response_model=List[TrippingIncidentResponse])
async def get_tripping_incidents(
    line_id: Optional[int] = None,
    voltage_level: Optional[str] = None,
    fault_type: Optional[str] = None,
    attributed_to_powergrid: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(TrippingIncident).join(TransmissionLine)
    
    if line_id:
        query = query.filter(TrippingIncident.transmission_line_id == line_id)
    if voltage_level:
        query = query.filter(TransmissionLine.voltage_level == voltage_level)
    if fault_type:
        query = query.filter(TrippingIncident.fault_type == fault_type)
    if attributed_to_powergrid:
        query = query.filter(TrippingIncident.attributed_to_powergrid == attributed_to_powergrid)
    
    incidents = query.all()
    
    return [
        TrippingIncidentResponse(
            id=incident.id,
            line_id=incident.transmission_line_id,
            line_name=incident.transmission_line.line_name,
            voltage_level=incident.transmission_line.voltage_level,
            fault_date=incident.fault_date,
            fault_time=incident.fault_time,
            fault_type=incident.fault_type,
            fault_location=incident.fault_location,
            affected_phases=incident.affected_phases,
            restoration_time=incident.restoration_time,
            downtime_minutes=incident.downtime_minutes,
            attributed_to_powergrid=incident.attributed_to_powergrid,
            root_cause=incident.root_cause,
            corrective_action=incident.corrective_action,
            remarks=incident.remarks
        ) for incident in incidents
    ]

@app.post("/tripping-incidents/", response_model=TrippingIncidentResponse)
async def create_tripping_incident(
    incident: TrippingIncidentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can create tripping incidents")
    
    line = db.query(TransmissionLine).filter(TransmissionLine.id == incident.line_id).first()
    if not line:
        raise HTTPException(status_code=400, detail="Transmission line not found")
    
    db_incident = TrippingIncident(
        transmission_line_id=incident.line_id,
        fault_date=incident.fault_date,
        fault_time=incident.fault_time,
        fault_type=incident.fault_type,
        fault_location=incident.fault_location,
        affected_phases=incident.affected_phases,
        restoration_time=incident.restoration_time,
        downtime_minutes=incident.downtime_minutes,
        attributed_to_powergrid=incident.attributed_to_powergrid,
        root_cause=incident.root_cause,
        corrective_action=incident.corrective_action,
        remarks=incident.remarks
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    
    return TrippingIncidentResponse(id=db_incident.id,
        line_id=db_incident.transmission_line_id,
        line_name=db_incident.transmission_line.line_name,
        voltage_level=db_incident.transmission_line.voltage_level,
        fault_date=db_incident.fault_date,
        fault_time=db_incident.fault_time,
        fault_type=db_incident.fault_type,
        fault_location=db_incident.fault_location,
        affected_phases=db_incident.affected_phases,
        restoration_time=db_incident.restoration_time,
        downtime_minutes=db_incident.downtime_minutes,
        attributed_to_powergrid=db_incident.attributed_to_powergrid,
        root_cause=db_incident.root_cause,
        corrective_action=db_incident.corrective_action,
        remarks=db_incident.remarks
    )

@app.put("/tripping-incidents/{incident_id}", response_model=TrippingIncidentResponse)
async def update_tripping_incident(
    incident_id: int,
    incident: TrippingIncidentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can update tripping incidents")
    
    db_incident = db.query(TrippingIncident).filter(TrippingIncident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Tripping incident not found")
    
    db_incident.transmission_line_id = incident.line_id
    db_incident.fault_date = incident.fault_date
    db_incident.fault_time = incident.fault_time
    db_incident.fault_type = incident.fault_type
    db_incident.fault_location = incident.fault_location
    db_incident.affected_phases = incident.affected_phases
    db_incident.restoration_time = incident.restoration_time
    db_incident.downtime_minutes = incident.downtime_minutes
    db_incident.attributed_to_powergrid = incident.attributed_to_powergrid
    db_incident.root_cause = incident.root_cause
    db_incident.corrective_action = incident.corrective_action
    db_incident.remarks = incident.remarks
    
    db.commit()
    db.refresh(db_incident)
    
    return TrippingIncidentResponse(
        id=db_incident.id,
        line_id=db_incident.transmission_line_id,
        line_name=db_incident.transmission_line.line_name,
        voltage_level=db_incident.transmission_line.voltage_level,
        fault_date=db_incident.fault_date,
        fault_time=db_incident.fault_time,
        fault_type=db_incident.fault_type,
        fault_location=db_incident.fault_location,
        affected_phases=db_incident.affected_phases,
        restoration_time=db_incident.restoration_time,
        downtime_minutes=db_incident.downtime_minutes,
        attributed_to_powergrid=db_incident.attributed_to_powergrid,
        root_cause=db_incident.root_cause,
        corrective_action=db_incident.corrective_action,
        remarks=db_incident.remarks
    )

@app.delete("/tripping-incidents/{incident_id}")
async def delete_tripping_incident(
    incident_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can delete tripping incidents")
    
    db_incident = db.query(TrippingIncident).filter(TrippingIncident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Tripping incident not found")
    
    db.delete(db_incident)
    db.commit()
    return {"message": "Tripping incident deleted successfully"}

# ==================== SUPPORTING ENDPOINTS ====================

@app.get("/states/")
async def get_states(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all states"""
    states = db.query(State).all()
    return [{"id": state.id, "name": state.name, "code": state.code} for state in states]

@app.get("/maintenance-offices/")
async def get_maintenance_offices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all maintenance offices"""
    offices = db.query(MaintenanceOffice).all()
    return [
        {
            "id": office.id,
            "name": office.name,
            "location": office.location
        } for office in offices
    ]



# ==================== PREDICTIVE MAINTENENCE ====================


@app.get("/api/ai/predictive-maintenance")
async def get_predictive_maintenance(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered predictive maintenance recommendations"""
    try:
        model = PredictiveMaintenanceModel()
        predictions = model.predict_maintenance_needs(db)
        
        return {
            "predictions": predictions,
            "generated_at": datetime.now().isoformat(),
            "model_info": "Random Forest Classifier - Predictive Maintenance v1.0"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/train-model")
async def train_ai_model(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train/retrain the AI model"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        model = PredictiveMaintenanceModel()
        success = model.train_model(db)
        
        return {"success": success, "message": "Model trained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/model-metrics")
async def get_model_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI model performance metrics"""
    try:
        model = PredictiveMaintenanceModel()
        metrics = model.get_model_metrics(db)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CHATBOT ====================
@app.post("/api/ai/chatbot")
async def chatbot_query(
    chat_message: ChatMessage,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """AI chatbot for natural language queries"""
    try:
        chatbot = PowerGridChatbot(db)
        response = chatbot.process_query(chat_message.message)
        
        return {
            "query": chat_message.message,
            "response": response['response'],
            "type": response['type'],
            "data": response.get('data'),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RUN ====================

if __name__ == "__main__":
    create_tables()
    print("✅ Database tables initialized")
    print("🚀 Starting PowerGrid API server...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
