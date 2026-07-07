from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import time

# Initialize FastAPI app
app = FastAPI(title="PipelineSim API")

# --- Mock In-Memory Database Initialization ---
tasks_db: List[dict] = []

# --- Pydantic Models for Data Validation ---
class Task(BaseModel):
    id: int
    title: str
    stage: str
    priority: str

class TaskCreate(BaseModel):
    title: str
    priority: str

class TaskUpdate(BaseModel):
    stage: str

# --- API Endpoints ---

@app.get("/api/tasks", response_model=List[Task])
async def get_tasks():
    """Fetch all tasks."""
    return tasks_db

@app.post("/api/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    """Inject a new task into the backlog."""
    new_task = {
        "id": int(time.time() * 1000), # Generate a unique ID based on timestamp
        "title": task.title,
        "stage": "backlog",
        "priority": task.priority
    }
    tasks_db.append(new_task)
    return new_task

@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task_stage(task_id: int, task_update: TaskUpdate):
    """Shift a task to a different stage."""
    for task in tasks_db:
        if task["id"] == task_id:
            task["stage"] = task_update.stage
            return task
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int):
    """Purge a task from the pipeline."""
    global tasks_db
    tasks_db = [task for task in tasks_db if task["id"] != task_id]
    return {"message": "Task deleted successfully"}
