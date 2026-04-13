from fastapi import FastAPI
from api.routes import category

app = FastAPI(title="Costview API", version="1.0.0")

# Register routes
app.include_router(category.router, prefix="/api/v1/categories")

@app.get("/")
async def root():
    return {"message": "Welcome to Costview API"}
