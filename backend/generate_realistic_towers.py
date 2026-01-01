from database import SessionLocal, TransmissionLine, TowerLocation
import math

db = SessionLocal()

# Real NER transmission line endpoints (city coordinates)
line_endpoints = {
    "400 KV SILCHAR-IMPHAL": {
        "from": {"name": "Silchar", "lat": 24.8333, "lng": 92.7979},
        "to": {"name": "Imphal", "lat": 24.8170, "lng": 93.9368},
    },
    "400 KV BONGAIGAON-SALAKATI": {
        "from": {"name": "Bongaigaon", "lat": 26.4831, "lng": 90.5633},
        "to": {"name": "Salakati", "lat": 26.1445, "lng": 91.7898},
    },
    "400 KV GUWAHATI-SHILLONG": {
        "from": {"name": "Guwahati", "lat": 26.1445, "lng": 91.7362},
        "to": {"name": "Shillong", "lat": 25.5788, "lng": 91.8933},
    },
    "220 KV AGARTALA-PALATANA": {
        "from": {"name": "Agartala", "lat": 23.8315, "lng": 91.2868},
        "to": {"name": "Palatana", "lat": 23.5987, "lng": 91.6453},
    },
    "220 KV DIMAPUR-KOHIMA": {
        "from": {"name": "Dimapur", "lat": 25.9039, "lng": 93.7380},
        "to": {"name": "Kohima", "lat": 25.6751, "lng": 94.1086},
    },
    "132 KV GANGTOK-RANGPO": {
        "from": {"name": "Gangtok", "lat": 27.3389, "lng": 88.6065},
        "to": {"name": "Rangpo", "lat": 27.1694, "lng": 88.5339},
    },
}

def interpolate_towers(from_coord, to_coord, num_towers):
    """Generate evenly-spaced tower coordinates between two points"""
    towers = []
    for i in range(num_towers):
        ratio = i / (num_towers - 1) if num_towers > 1 else 0
        lat = from_coord["lat"] + (to_coord["lat"] - from_coord["lat"]) * ratio
        lng = from_coord["lng"] + (to_coord["lng"] - from_coord["lng"]) * ratio
        towers.append({"lat": lat, "lng": lng})
    return towers

# Delete all existing towers first
print("Deleting existing towers...")
db.query(TowerLocation).delete()
db.commit()

# Generate towers for each line
for line_name, endpoints in line_endpoints.items():
    # Find the line in database
    line = db.query(TransmissionLine).filter(
        TransmissionLine.line_name.like(f"%{line_name.split()[2]}%")

    ).first()
    
    if not line:
        print(f"⚠️  Line not found: {line_name}")
        continue
    
    # Calculate number of towers based on line length
    # Typically 1 tower per 0.3-0.5 km for 400kV, 0.25-0.4km for 220kV
    if "400 KV" in line.voltage_level:
        towers_per_km = 2.5  # ~400m spacing
    elif "220 KV" in line.voltage_level:
        towers_per_km = 3    # ~333m spacing
    else:
        towers_per_km = 4    # ~250m spacing for 132kV
    
    num_towers = max(5, int(line.total_length_km * towers_per_km))
    
    # Generate tower positions
    tower_coords = interpolate_towers(endpoints["from"], endpoints["to"], num_towers)
    
    print(f"\n✓ Creating {num_towers} towers for {line.line_name}")
    
    # Create towers
    for i, coord in enumerate(tower_coords, 1):
        tower = TowerLocation(
            transmission_line_id=line.id,
            tower_number=f"T{i:03d}",
            latitude=coord["lat"],
            longitude=coord["lng"],
            height_meters=45.0 if "400 KV" in line.voltage_level else 35.0,
            tower_type="Suspension" if i % 5 != 0 else "Tension",
            condition="Good",
            foundation_type="RCC",
        )
        db.add(tower)
    
db.commit()
print("\n✅ Done! Generated realistic tower locations.")
print("🗺️  Refresh your GIS Map to see the lines!")

db.close()
