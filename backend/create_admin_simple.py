from database import SessionLocal, User, create_tables
from datetime import datetime
import hashlib

def simple_hash(password: str) -> str:
    """Simple SHA256 hash"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_admin():
    # Make sure tables exist
    create_tables()
    
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@powergrid.com").first()
        if admin:
            print("✅ Admin user already exists!")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            db.close()
            return
        
        # Create admin user with simple hash
        admin_user = User(
            email="admin@powergrid.com",
            username="admin",
            hashed_password=simple_hash("admin123"),
            full_name="System Administrator",
            role="admin",
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print(f"   Email: {admin_user.email}")
        print(f"   Password: admin123")
        print(f"   Role: {admin_user.role}")
        print("\n⚠️  Please change the password after first login!")
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
