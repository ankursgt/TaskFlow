import time

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    status,
)
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from algorithms.sorting import insertion_sort
from db import Base, engine, get_db
from models import User, Project, Task

from schemas import (
    UserCreate,
    UserResponse,
    ProjectCreate,
    ProjectResponse,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    ProjectTaskStats,
    QuickAddRequest,
    TaskResponse,
)
from quick_add_parser import parse_quick_add
from quick_add_prompt import build_quick_add_messages


# DATABASE

Base.metadata.create_all(bind=engine)


# FASTAPI APPLICATION

app = FastAPI(
    title="TaskFlow API",
    version="1.0.0",
)


# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
    ],
)


# CUSTOM MIDDLEWARE

@app.middleware("http")
async def request_logging_middleware(
    request: Request,
    call_next,
):
    start_time = time.perf_counter()

    response = await call_next(request)

    processing_time = (
        time.perf_counter() - start_time
    ) * 1000

    print(
        f"{request.method} "
        f"{request.url.path} "
        f"{processing_time:.2f} ms "
        f"[{response.status_code}]"
    )

    return response


# ROOT

@app.get("/")
def root():
    return {
        "message": "TaskFlow API"
    }


# USERS

@app.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already exists",
        )

    user = User(
        email=user_data.email,
        name=user_data.name,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@app.get(
    "/users",
    response_model=list[UserResponse],
)
def list_users(
    db: Session = Depends(get_db),
):
    return db.query(User).all()


# PROJECTS

@app.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
):
    owner = (
        db.query(User)
        .filter(User.id == project_data.owner_id)
        .first()
    )

    if not owner:
        raise HTTPException(
            status_code=404,
            detail="Owner user not found",
        )

    project = Project(
        name=project_data.name,
        owner_id=project_data.owner_id,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@app.get(
    "/projects",
    response_model=list[ProjectResponse],
)
def list_projects(
    db: Session = Depends(get_db),
):
    return db.query(Project).all()


# TASKS - CREATE

@app.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == task_data.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        status=task_data.status,
        due_date=task_data.due_date,
        project_id=task_data.project_id,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# TASKS - LIST

@app.get(
    "/tasks",
    response_model=list[TaskResponse],
)
def list_tasks(
    sort: str | None = None,
    db: Session = Depends(get_db),
):
    tasks = db.query(Task).all()

    records = [
        {
            "id": task.id,
            "title": task.title,
            "priority": task.priority,
            "due_date": task.due_date,
            "project_id": task.project_id,
        }
        for task in tasks
    ]
     
    # Sort by priority using our insertion_sort implementation.

    if sort == "priority":

        priority_rank = {
            "low": 1,
            "medium": 2,
            "high": 3,
        }

        for record in records:
            record["priority_rank"] = priority_rank[
                record["priority"]
            ]

        insertion_sort(
            records,
            "priority_rank",
        )

        # Remove the internal sorting field
        # before returning the response.
        for record in records:
            del record["priority_rank"]

    return records

@app.post(
    "/tasks/quick-add",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def quick_add_task(
    request: QuickAddRequest,
    db: Session = Depends(get_db),
):

    messages = build_quick_add_messages(
        request.description
    )

    # Prevent unused-variable issues while documenting
    # the intended prompt structure.
    _ = messages

    project = (
        db.query(Project)
        .filter(Project.id == request.project_id)
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "project_id": (
                    f"Project {request.project_id} does not exist"
                )
            },
        )


    parsed = parse_quick_add(
        request.description
    )

    # Construct the object that will be persisted.

    task_data = {
        "title": parsed.title,
        "priority": parsed.priority,
        "due_date": parsed.due_date_hint,
        "project_id": request.project_id,
    }


    validated_task = TaskResponse.model_validate(
        {
            "id": 0,
            **task_data,
        }
    )

    #  Create actual SQLAlchemy row.

    task = Task(
        title=validated_task.title,
        priority=validated_task.priority,
        due_date=validated_task.due_date,
        project_id=validated_task.project_id,
    )

    db.add(task)
    db.commit()
    db.refresh(task)


    # Return actual persisted task.

    return task

@app.get(
    "/tasks/statistics/by-project",
    response_model=list[ProjectTaskStats],
)
def task_statistics_by_project(
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Project.id.label("project_id"),

            Project.name.label("project_name"),

            func.count(Task.id).label(
                "task_count"
            ),

            func.sum(
                case(
                    (Task.status == "pending", 1),
                    else_=0,
                )
            ).label("pending_count"),

            func.sum(
                case(
                    (Task.status == "in_progress", 1),
                    else_=0,
                )
            ).label("in_progress_count"),

            func.sum(
                case(
                    (Task.status == "completed", 1),
                    else_=0,
                )
            ).label("completed_count"),
        )
        .outerjoin(
            Task,
            Task.project_id == Project.id,
        )
        .group_by(
            Project.id,
            Project.name,
        )
        .all()
    )

    return [
        ProjectTaskStats(
            project_id=row.project_id,
            project_name=row.project_name,
            task_count=row.task_count,
            pending_count=row.pending_count or 0,
            in_progress_count=row.in_progress_count or 0,
            completed_count=row.completed_count or 0,
        )
        for row in rows
    ]


# TASKS - GET BY ID

@app.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


# TASKS - UPDATE

@app.put(
    "/tasks/{task_id}",
    response_model=TaskResponse,
)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    update_data = task_data.model_dump(
        exclude_unset=True
    )

    # Validate project if it is being changed.
    if "project_id" in update_data:
        project = (
            db.query(Project)
            .filter(
                Project.id
                == update_data["project_id"]
            )
            .first()
        )

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found",
            )

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


# TASKS - DELETE

@app.delete(
    "/tasks/{task_id}",
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }