from mongoengine import connect
from dotenv import dotenv_values
from mongoengine.connection import  get_connection

def connect_db():
    config = dotenv_values(".env")
    uri = config.get("MONGGO_URL")
    # Extract database name from URI if present, otherwise use config or default
    # URI format: mongodb+srv://.../E-Learning or mongodb://.../E-Learning
    db_name = None
    if uri:
        # Extract database name from URI (after last / and before ?)
        # Handle both mongodb:// and mongodb+srv://
        if 'mongodb+srv://' in uri:
            # Format: mongodb+srv://user:pass@host/dbname?options
            parts = uri.replace('mongodb+srv://', '').split('/')
            if len(parts) > 1:
                db_from_uri = parts[1].split('?')[0].strip()
                if db_from_uri:
                    db_name = db_from_uri
        elif 'mongodb://' in uri:
            # Format: mongodb://user:pass@host:port/dbname?options
            parts = uri.replace('mongodb://', '').split('/')
            if len(parts) > 1:
                db_from_uri = parts[1].split('?')[0].strip()
                if db_from_uri:
                    db_name = db_from_uri
    
    # Fallback to config or default
    if not db_name:
        db_name = config.get("MONGODB_DB_NAME", "E-Learning")  # Match backend: E-Learning (capital L)
    
    print(f"📊 Using database: {db_name}")

    try:
        connect(
            db=db_name,
            host=uri,
            alias="default"
        )
        conn = get_connection()
        # Verify collections exist
        db = conn[db_name]
        collections = db.list_collection_names()
        
        # Check if our collections exist
        if 'Road_Map' in collections:
            count = db['Road_Map'].count_documents({})
        else:
            print(f"Road_Map collection does not exist yet (will be created on first save)")
            
        if 'Learning_Path' in collections:
            count = db['Learning_Path'].count_documents({})
        else:
            print(f"  Learning_Path collection does not exist yet (will be created on first save)")
            
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        import traceback
        traceback.print_exc()
        raise