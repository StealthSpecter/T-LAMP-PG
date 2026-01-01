import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from database import Base, engine, SessionLocal, User, State, MaintenanceOffice, TransmissionLine, TrippingIncident, TowerLocation

from auth import get_password_hash

# Sample data
STATES = [
    {"name": "Assam", "code": "AS", "region": "North East"},
    {"name": "Meghalaya", "code": "ML", "region": "North East"},
    {"name": "Manipur", "code": "MN", "region": "North East"},
    {"name": "Mizoram", "code": "MZ", "region": "North East"},
    {"name": "Nagaland", "code": "NL", "region": "North East"},
    {"name": "Tripura", "code": "TR", "region": "North East"},
    {"name": "Arunachal Pradesh", "code": "AR", "region": "North East"},
    {"name": "Sikkim", "code": "SK", "region": "North East"}
]

MAINTENANCE_OFFICES = [
    {"name": "GUWAHATI", "location": "Guwahati, Assam", "contact_person": "Rajesh Kumar", "phone": "+91-361-2345678"},
    {"name": "SHILLONG", "location": "Shillong, Meghalaya", "contact_person": "Priya Sharma", "phone": "+91-364-2234567"},
    {"name": "DIMAPUR", "location": "Dimapur, Nagaland", "contact_person": "Kiran Devi", "phone": "+91-3862-234567"},
    {"name": "IMPHAL", "location": "Imphal, Manipur", "contact_person": "Mohan Singh", "phone": "+91-385-2445678"},
    {"name": "AIZAWL", "location": "Aizawl, Mizoram", "contact_person": "Lalitha Rani", "phone": "+91-389-2334567"},
    {"name": "AGARTALA", "location": "Agartala, Tripura", "contact_person": "Suresh Babu", "phone": "+91-381-2556789"},
    {"name": "ITANAGAR", "location": "Itanagar, Arunachal Pradesh", "contact_person": "Anita Das", "phone": "+91-360-2667890"},
    {"name": "GANGTOK", "location": "Gangtok, Sikkim", "contact_person": "Bijay Thapa", "phone": "+91-3592-234567"}
]

TRANSMISSION_LINES = [
    {"name": "400 KV SILCHAR-IMPHAL", "voltage_level": "400 KV", "length": 215.8, "state": "Assam"},
    {"name": "400 KV MISA-SILCHAR", "voltage_level": "400 KV", "length": 189.5, "state": "Assam"},
    {"name": "400 KV BONGAIGAON-SALAKATI", "voltage_level": "400 KV", "length": 167.3, "state": "Assam"},
    {"name": "400 KV GUWAHATI-SHILLONG", "voltage_level": "400 KV", "length": 102.4, "state": "Meghalaya"},
    {"name": "220 KV MISA-DIMAPUR", "voltage_level": "220 KV", "length": 145.6, "state": "Nagaland"},
    {"name": "220 KV DIMAPUR-KOHIMA", "voltage_level": "220 KV", "length": 78.9, "state": "Nagaland"},
    {"name": "220 KV IMPHAL-MOREH", "voltage_level": "220 KV", "length": 112.3, "state": "Manipur"},
    {"name": "220 KV AIZAWL-LUNGLEI", "voltage_level": "220 KV", "length": 165.7, "state": "Mizoram"},
    {"name": "220 KV AGARTALA-PALATANA", "voltage_level": "220 KV", "length": 89.4, "state": "Tripura"},
    {"name": "132 KV ITANAGAR-PASIGHAT", "voltage_level": "132 KV", "length": 198.2, "state": "Arunachal Pradesh"},
    {"name": "132 KV GANGTOK-RANGPO", "voltage_level": "132 KV", "length": 67.5, "state": "Sikkim"},
    {"name": "132 KV TEZPUR-BHALUKPONG", "voltage_level": "132 KV", "length": 134.8, "state": "Assam"},
    {"name": "400 KV BYRNIHAT-NONGPOH", "voltage_level": "400 KV", "length": 95.3, "state": "Meghalaya"},
    {"name": "220 KV TURA-BAGHMARA", "voltage_level": "220 KV", "length": 118.7, "state": "Meghalaya"},
    {"name": "132 KV CHAMPHAI-SERCHHIP", "voltage_level": "132 KV", "length": 156.4, "state": "Mizoram"}
]

FOUNDATION_TYPES = ["Single Pile", "Four Pile", "RCC", "Steel Lattice"]
TOWER_TYPES = ["Suspension", "Tension", "Angle", "Dead End"]
TOWER_CONDITIONS = ["Good", "Good", "Good", "Good", "Needs Inspection", "Under Repair"]
FAULT_TYPES = ["LIGHTNING", "VEGETATION", "HARDWARE FAULT", "FOREST FIRE", "BIRD NEST", "OTHER UTILITIES", "OTHERS"]
ATTRIBUTED_OPTIONS = ["YES", "YES", "NO", "NO", "PENDING"]

# GPS coordinates for North East India region
BASE_COORDS = {
    "Assam": (26.2006, 92.9376),
    "Meghalaya": (25.4670, 91.3662),
    "Manipur": (24.6637, 93.9063),
    "Mizoram": (23.1645, 92.9376),
    "Nagaland": (26.1584, 94.5624),
    "Tripura": (23.9408, 91.9882),
    "Arunachal Pradesh": (28.2180, 94.7278),
    "Sikkim": (27.5330, 88.5122)
}

def get_random_coord_near(base_lat, base_lon, max_distance_km=50):
    """Generate random coordinates near a base point"""
    lat_offset = random.uniform(-max_distance_km/111, max_distance_km/111)
    lon_offset = random.uniform(-max_distance_km/111, max_distance_km/111)
    return round(base_lat + lat_offset, 6), round(base_lon + lon_offset, 6)

def generate_random_date(start_date, end_date):
    """Generate random date between start and end"""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return start_date + timedelta(days=random_days)

async def seed_database():
    db = SessionLocal()
    try:
        from database import User, State, MaintenanceOffice, TransmissionLine, TowerLocation, TrippingIncident
        
        print("🌱 Starting database seeding...")
        
        # Clear existing data
        print("🗑️  Clearing existing data...")
        db.query(TrippingIncident).delete()
        db.query(TowerLocation).delete()
        db.query(TransmissionLine).delete()
        db.query(MaintenanceOffice).delete()
        db.query(State).delete()
        db.query(User).delete()
        db.commit()
        
        # 1. Create Users
        print("👤 Creating users...")
        users = [
            User(
                username="admin",
                email="admin@powergrid.in",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                designation="System Admin",
                department="IT Department",
                is_active=True
            ),
            User(
                username="engineer1",
                email="engineer1@powergrid.in",
                full_name="Rahul Verma",
                hashed_password=get_password_hash("engineer123"),
                role="user",
                designation="Senior Engineer",
                department="Transmission Maintenance",
                is_active=True
            ),
            User(
                username="engineer2",
                email="engineer2@powergrid.in",
                full_name="Priya Singh",
                hashed_password=get_password_hash("engineer123"),
                role="user",
                designation="Junior Engineer",
                department="Operations",
                is_active=True
            ),
            User(
                username="manager1",
                email="manager1@powergrid.in",
                full_name="Amit Kumar",
                hashed_password=get_password_hash("manager123"),
                role="user",
                designation="Manager",
                department="North East Region",
                is_active=True
            )
        ]
        db.add_all(users)
        db.commit()
        print(f"✅ Created {len(users)} users")
        
        # 2. Create States
        print("🗺️  Creating states...")
        state_objects = []
        for state_data in STATES:
            state = State(**state_data)
            db.add(state)
            state_objects.append(state)
        db.commit()
        print(f"✅ Created {len(state_objects)} states")
        
        # 3. Create Maintenance Offices
        print("🏢 Creating maintenance offices...")
        office_objects = []
        for office_data in MAINTENANCE_OFFICES:
            office = MaintenanceOffice(**office_data)
            db.add(office)
            office_objects.append(office)
        db.commit()
        print(f"✅ Created {len(office_objects)} maintenance offices")
        
        # 4. Create Transmission Lines
        print("⚡ Creating transmission lines...")
        line_objects = []
        for line_data in TRANSMISSION_LINES:
            state = db.query(State).filter(State.name == line_data["state"]).first()
            office = random.choice(office_objects)
            
            commission_date = generate_random_date(
                datetime(2015, 1, 1),
                datetime(2023, 12, 31)
            )
            
            line = TransmissionLine(
                line_name=line_data["name"],
                voltage_level=line_data["voltage_level"],
                total_length_km=line_data["length"],
                commission_date=commission_date.date(),
                state_id=state.id,
                maintenance_office_id=office.id,
                status=random.choice(["Active", "Active", "Active", "Under Maintenance"]),
                remarks=f"Commissioned in {commission_date.year}"
            )
            db.add(line)
            line_objects.append(line)
        db.commit()
        print(f"✅ Created {len(line_objects)} transmission lines")
        
        # 5. Create Tower Locations
        print("🗼 Creating tower locations...")
        tower_count = 0
        for line in line_objects:
            state = db.query(State).filter(State.id == line.state_id).first()
            base_lat, base_lon = BASE_COORDS[state.name]
            
            num_towers = int(line.total_length_km / random.uniform(3, 5))
            num_towers = min(max(num_towers, 15), 50)
            
            for i in range(num_towers):
                lat, lon = get_random_coord_near(base_lat, base_lon, line.total_length_km / 2)
                
                tower = TowerLocation(
                    transmission_line_id=line.id,
                    tower_number=f"T{str(i+1).zfill(3)}",
                    latitude=lat,
                    longitude=lon,
                    foundation_type=random.choice(FOUNDATION_TYPES),
                    tower_type=random.choice(TOWER_TYPES),
                    height_meters=round(random.uniform(30, 65), 2),
                    installation_date=line.commission_date,
                    last_inspection_date=generate_random_date(
                        datetime(2024, 1, 1),
                        datetime(2024, 11, 25)
                    ).date(),
                    condition=random.choice(TOWER_CONDITIONS),
                    remarks=f"Tower {i+1} on {line.line_name}"
                )
                db.add(tower)
                tower_count += 1
        
        db.commit()
        print(f"✅ Created {tower_count} tower locations")
        
        # 6. Create Tripping Incidents
        print("⚠️  Creating tripping incidents...")
        incident_count = 0
        num_incidents = random.randint(80, 150)
        
        for _ in range(num_incidents):
            line = random.choice(line_objects)
            towers = db.query(TowerLocation).filter(TowerLocation.transmission_line_id == line.id).all()
            
            if not towers:
                continue
            
            tower = random.choice(towers)
            
            fault_date = generate_random_date(
                datetime(2024, 1, 1),
                datetime(2024, 11, 25)
            )
            
            fault_time = f"{random.randint(0, 23):02d}:{random.randint(0, 59):02d}:00"
            downtime = random.randint(15, 480)
            
            restoration_hours = downtime // 60
            restoration_minutes = downtime % 60
            restoration_time = None
            if random.random() > 0.1:
                restoration_time = f"{(int(fault_time[:2]) + restoration_hours) % 24:02d}:{(int(fault_time[3:5]) + restoration_minutes) % 60:02d}:00"
            
            fault_type = random.choice(FAULT_TYPES)
            attributed = random.choice(ATTRIBUTED_OPTIONS)
            
            root_causes = {
                "LIGHTNING": "Lightning strike during monsoon season",
                "VEGETATION": "Tree branches in contact with conductors",
                "HARDWARE FAULT": "Insulator failure due to aging",
                "FOREST FIRE": "Fire in nearby forest area",
                "BIRD NEST": "Large bird nest on tower structure",
                "OTHER UTILITIES": "Telecommunication line interference",
                "OTHERS": "Unknown reason under investigation"
            }
            
            incident = TrippingIncident(
                transmission_line_id=line.id,
                fault_date=fault_date.date(),
                fault_time=fault_time,
                fault_type=fault_type,
                fault_location=f"Tower #{tower.tower_number}",
                affected_phases=random.choice(["R-Y-B", "R-Y", "Y-B", "R-B", "R", "Y", "B"]),
                restoration_time=restoration_time,
                downtime_minutes=downtime,
                attributed_to_powergrid=attributed,
                root_cause=root_causes.get(fault_type, "Under investigation"),
                corrective_action="Inspection completed and repairs done" if attributed == "YES" else "Under review",
                remarks=f"Incident on {fault_date.strftime('%d-%b-%Y')}"
            )
            db.add(incident)
            incident_count += 1
        
        db.commit()
        print(f"✅ Created {incident_count} tripping incidents")
        
        print("\n" + "="*60)
        print("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"   • Users: {len(users)}")
        print(f"   • States: {len(state_objects)}")
        print(f"   • Maintenance Offices: {len(office_objects)}")
        print(f"   • Transmission Lines: {len(line_objects)}")
        print(f"   • Tower Locations: {tower_count}")
        print(f"   • Tripping Incidents: {incident_count}")
        print("\n🔐 Login Credentials:")
        print("   Admin: admin / admin123")
        print("   Engineer: engineer1 / engineer123")
        print("   Engineer: engineer2 / engineer123")
        print("   Manager: manager1 / manager123")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
