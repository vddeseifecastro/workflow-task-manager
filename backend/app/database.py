from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Aquí se crea el archivo workflow.db automáticamente
SQLALCHEMY_DATABASE_URL = "sqlite:///./workflow.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Necesario para SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Función que usaremos en cada endpoint para obtener la BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()