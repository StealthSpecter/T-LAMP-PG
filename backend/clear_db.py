import os
from database import SessionLocal, State, MaintenanceOffice, TransmissionLine, TrippingIncident, TowerLocation

def clear_database():
    # Delete the database file if it exists
    db_file = "powergrid.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"✅ Database file '{db_file}' deleted successfully!")
    else:
        print("ℹ️  Database file doesn't exist.")
    
    print("Database cleared. Run 'python create_db.py' and 'python seed_data.py' to recreate.")

if __name__ == "__main__":
    clear_database()
