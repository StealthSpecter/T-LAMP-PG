from database import SessionLocal, User
from auth import get_password_hash

def create_admin():
    db = SessionLocal()
    
    # Check if admin already exists
    admin = db.query(User).filter(User.email == "admin@powergrid.com").first()
    if admin:
        print("Admin user already exists!")
        db.close()
        return
    
    # Create admin user
    admin_user = User(
        email="admin@powergrid.com",
        username="admin",
        hashed_password=get_password_hash("admin123"),  # Change this password!
        full_name="System Administrator",
        role="admin",
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print("✅ Admin user created successfully!")
    print(f"   Email: {admin_user.email}")
    print(f"   Password: admin123")
    print(f"   Role: {admin_user.role}")
    print("\n⚠️  Please change the password after first login!")
    
    db.close()

if __name__ == "__main__":
    create_admin()
