from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv


load_dotenv()

SQLALCHEMY_DATABASE_URL = "sqlite:///./powergrid.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    designation = Column(String(100), default="Employee")
    department = Column(String(100), default="General")
    role = Column(String(20), default="user")  # admin or user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

class State(Base):
    __tablename__ = "states"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    code = Column(String(10))
    region = Column(String(100), default="North East")
    
    lines = relationship("TransmissionLine", back_populates="state")

    

class MaintenanceOffice(Base):
    __tablename__ = "maintenance_offices"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    location = Column(String(200))
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    lines = relationship("TransmissionLine", back_populates="maintenance_office")


class TransmissionLine(Base):
    __tablename__ = "transmission_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    line_name = Column(String(200), index=True)
    voltage_level = Column(String(20))
    commission_date = Column(Date)
    total_length_km = Column(Float)
    state_id = Column(Integer, ForeignKey("states.id"))
    maintenance_office_id = Column(Integer, ForeignKey("maintenance_offices.id"))
    status = Column(String(50), default="Active")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    state = relationship("State", back_populates="lines")
    maintenance_office = relationship("MaintenanceOffice", back_populates="lines")
    tripping_incidents = relationship("TrippingIncident", back_populates="transmission_line", cascade="all, delete-orphan")
    towers = relationship("TowerLocation", back_populates="transmission_line", cascade="all, delete-orphan")

class TrippingIncident(Base):
    __tablename__ = "tripping_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    transmission_line_id = Column(Integer, ForeignKey("transmission_lines.id"))
    fault_date = Column(Date)
    fault_time = Column(String(10))
    fault_type = Column(String(100))
    fault_location = Column(String(200))
    affected_phases = Column(String(50))
    restoration_time = Column(String(10), nullable=True)
    downtime_minutes = Column(Integer)
    attributed_to_powergrid = Column(String(10), default="YES")
    root_cause = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    transmission_line = relationship("TransmissionLine", back_populates="tripping_incidents")

class TowerLocation(Base):
    __tablename__ = "tower_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    transmission_line_id = Column(Integer, ForeignKey("transmission_lines.id"))
    tower_number = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    foundation_type = Column(String(50))
    tower_type = Column(String(50))
    height_meters = Column(Float)
    installation_date = Column(Date, nullable=True)
    last_inspection_date = Column(Date, nullable=True)
    condition = Column(String(50), default="Good")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    transmission_line = relationship("TransmissionLine", back_populates="towers")

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
