from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import users, tasks

# Crea todas las tablas automáticamente al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WorkFlow Task Manager",
    description="API para gestión de tareas personales",
    version="1.0.0"
)

# CORS — permite que el frontend se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción cambiar por tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(users.router)
app.include_router(tasks.router)

@app.get("/", tags=["Root"])
def root():
    return {"message": "WorkFlow API funcionando ✅", "docs": "/docs"}