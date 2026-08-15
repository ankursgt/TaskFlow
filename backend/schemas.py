from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


# =========================================================
# USER
# =========================================================

class UserCreate(BaseModel):
    email: str
    name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str


# =========================================================
# PROJECT
# =========================================================

class ProjectCreate(BaseModel):
    name: str
    owner_id: int


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    owner_id: int


# =========================================================
# TASK
# =========================================================

class TaskCreate(BaseModel):
    title: str

    description: str | None = None

    priority: Literal["low", "medium", "high"] = Field(
        ...,
        description="Task priority",
    )

    status: str = "pending"

    # Intentionally raw text.
    due_date: str | None = None

    project_id: int

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("title cannot be blank")

        return value


class TaskUpdate(BaseModel):
    title: str | None = None

    description: str | None = None

    priority: Literal[
        "low",
        "medium",
        "high",
    ] | None = None

    status: str | None = None

    due_date: str | None = None

    project_id: int | None = None

    @field_validator("title")
    @classmethod
    def validate_title(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("title cannot be blank")

        return value


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    priority: Literal["low", "medium", "high"]
    status: str
    due_date: str | None
    project_id: int


# =========================================================
# STATISTICS
# =========================================================

class ProjectTaskStats(BaseModel):
    project_id: int
    project_name: str
    task_count: int
    pending_count: int
    in_progress_count: int
    completed_count: int