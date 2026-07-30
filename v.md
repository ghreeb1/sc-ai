PROMPT 1 — Project Structure + Docker Setup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building the backend for an Academic Success Platform.

This is a FastAPI application with PostgreSQL and Redis.

Create the full project structure with all necessary empty files and folders.

Then fill the following files with working content:

Project structure to create:

academic-backend/

├── app/

│ ├── **init**.py

│ ├── main.py

│ ├── config.py

│ ├── database.py

│ ├── cache.py

│ ├── dependencies.py

│ ├── models/

│ │ └── **init**.py

│ ├── schemas/

│ │ └── **init**.py

│ ├── routers/

│ │ └── **init**.py

│ ├── services/

│ │ └── **init**.py

│ └── utils/

│ └── **init**.py

├── tests/

│ ├── **init**.py

│ └── conftest.py

├── docker-compose.yml

├── requirements.txt

├── .env.example

├── .env

└── README.md

Fill these files:

docker-compose.yml:

PostgreSQL service using image: pgvector/pgvector:pg16-latest

Redis service using image: redis:7-alpine

Both with health checks and named volumes

Network: academic_network

requirements.txt with these exact packages:

fastapi==0.104.1, uvicorn[standard]==0.24.0, python-dotenv==1.0.0

sqlalchemy==2.0.23, alembic==1.13.0, asyncpg==0.29.0, psycopg2-binary==2.9.9, pgvector==0.2.1

redis==5.0.1

pydantic==2.5.0, pydantic-settings==2.1.0

python-jose[cryptography]==3.3.0, passlib[bcrypt]==1.7.4, bcrypt==4.1.1

openai==1.3.9

httpx==0.25.2, aiofiles==23.2.1

email-validator==2.1.0

pytest==7.4.3, pytest-asyncio==0.21.1

.env.example and .env with these variables:

DATABASE_URL=postgresql+asyncpg://academic_user:academic_password@localhost:5432/academic_db

REDIS_URL=redis://localhost:6379

SECRET_KEY=dev-secret-key-change-in-production-min-32-chars

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30

REFRESH_TOKEN_EXPIRE_DAYS=7

OPENAI_API_KEY=sk-your-key-here

MAX_AI_REQUESTS_PER_DAY=10

DEBUG=True

ENVIRONMENT=development

ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]

app/config.py:

Pydantic BaseSettings class named Settings

Load all variables from .env

Create global instance: settings = Settings()

app/database.py:

Async SQLAlchemy engine using asyncpg

async_session factory

Base = declarative_base()

async get_db() dependency that yields session

async init_db() that creates all tables

app/cache.py:

Global redis_client variable

async init_redis() using redis.asyncio.from_url()

async close_redis()

async get_cache(key) → dict or None

async set_cache(key, value, ttl=3600)

async delete_cache(key)

async increment(key, ttl=86400) → int (for rate limiting)

Helper functions: cache_key_gpa(user_id), cache_key_ai_rate(user_id)

app/main.py:

FastAPI app with title "Academic Success Platform API"

@asynccontextmanager lifespan: call init_db() and init_redis() on startup

CORSMiddleware with settings.allowed_origins

GET /health endpoint returning {"status": "ok", "environment": settings.environment}

docs at /api/docs

Do not add routers yet. Just the foundation.

Use type hints everywhere. Add docstrings to every function.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 2 — Database Models

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:
FastAPI backend for an Academic Success Platform
Using SQLAlchemy 2.0 async with PostgreSQL
Base is imported from app.database
UUID primary keys, all timestamps in UTC

Create these 5 model files inside app/models/:

File: app/models/user.py
Model: User
Fields:
id: UUID primary key, default=uuid4
email: String(255), unique, indexed, not null
password_hash: String(255), not null
name: String(255), not null
major: String(255), not null (e.g. "Computer Science")
university: String(255), nullable
level: Integer, not null, default=1 (1-4 for year of study)
enrollment_year: Integer, not null
is_active: Boolean, default=True
total_credit_hours: Integer, default=0
completed_credit_hours: Integer, default=0
created_at: DateTime, default=datetime.utcnow
updated_at: DateTime, default=datetime.utcnow, onupdate=datetime.utcnow

File: app/models/course.py
Model: Course
Fields:
id: UUID primary key
code: String(20), unique, indexed (e.g. "CS101")
name: String(255), not null
credit_hours: Integer, not null
major: String(255), indexed
is_elective: Boolean, default=False
semester_recommended: Integer, nullable (which semester to take it)
prerequisites: JSON, default=[] (list of course codes)
created_at: DateTime

File: app/models/gpa.py
Model: GPA (represents one course completion record)
Fields:
id: UUID primary key
user_id: UUID ForeignKey("users.id"), indexed
course_id: UUID ForeignKey("courses.id")
grade: String(3) (e.g. "A+", "B", "F")
grade_numeric: Float (e.g. 4.0, 3.0)
credit_hours: Integer
semester: String(20) (e.g. "Fall 2023")
year: Integer
semester_number: Integer (1,2,3...)
created_at: DateTime

File: app/models/study_plan.py
Model: StudyPlan
Fields:
id: UUID primary key
user_id: UUID ForeignKey("users.id"), indexed
course_id: UUID ForeignKey("courses.id")
status: String(20), default="planned" (Must support: planned/available/locked/in_progress/completed)
planned_semester: String(20), nullable (e.g. "Semester 1", "Semester 2")
created_at: DateTime
updated_at: DateTime

File: app/models/chat.py
Model: ChatHistory
Fields:
id: UUID primary key
user_id: UUID ForeignKey("users.id"), indexed
user_message: Text, not null
ai_response: Text, not null
tokens_used: Integer, default=0
created_at: DateTime, indexed

After creating all models, update app/models/**init**.py to import all models so SQLAlchemy can discover them when init_db() is called:

from app.models.user import User
from app.models.course import Course
from app.models.gpa import GPA
from app.models.study_plan import StudyPlan
from app.models.chat import ChatHistory

Use proper SQLAlchemy 2.0 syntax. Add repr to every model. Make sure relationships are set up correctly if needed, especially cascading or foreign keys.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 3 — Pydantic Schemas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

FastAPI backend, Academic Success Platform

Using Pydantic v2

These schemas are for request validation and response serialization

All schemas use model_config = ConfigDict(from_attributes=True) for ORM compatibility

Create these schema files inside app/schemas/:

File: app/schemas/user.py

UserRegister (request):

email: EmailStr

password: str (min_length=8)

name: str (min_length=2)

major: str

university: Optional[str] = None

level: int (ge=1, le=4)

enrollment_year: int (ge=2000, le=2030)

UserLogin (request):

email: EmailStr

password: str

UserResponse (response, from ORM):

id: UUID

email: str

name: str

major: str

university: Optional[str]

level: int

enrollment_year: int

total_credit_hours: int

completed_credit_hours: int

created_at: datetime

TokenResponse (response):

access_token: str

refresh_token: str

token_type: str = "bearer"

user: UserResponse

File: app/schemas/academic.py

CourseResponse (from ORM):

id: UUID

code: str

name: str

credit_hours: int

major: str

is_elective: bool

semester_recommended: Optional[int]

prerequisites: list[str]

GPAEntry (from ORM):

id: UUID

grade: str

grade_numeric: float

credit_hours: int

semester: str

year: int

course: CourseResponse (nested)

GPAResponse:

semester_gpa: float

cumulative_gpa: float

total_credits_completed: int

history: list[GPAEntry]

StudyPlanCourse (from ORM):

course: CourseResponse

status: str

planned_semester: Optional[str]

StudyPlanResponse:

completed: list[StudyPlanCourse]

available: list[StudyPlanCourse]

locked: list[StudyPlanCourse]

in_progress: list[StudyPlanCourse]

DashboardResponse:

user: UserResponse

current_gpa: float

cumulative_gpa: float

completed_credit_hours: int

total_credit_hours: int

graduation_percentage: float

current_courses: list[StudyPlanCourse]

File: app/schemas/chat.py

ChatRequest (request):

message: str (min_length=3, max_length=1000)

ChatMessageResponse (from ORM):

id: UUID

user_message: str

ai_response: str

tokens_used: int

created_at: datetime

ChatHistoryResponse:

messages: list[ChatMessageResponse]

total: int

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 4 — Auth Utils + Service

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

FastAPI backend, Academic Success Platform

settings object is imported from app.config

Database session is AsyncSession from SQLAlchemy

User model is in app.models.user

File: app/utils/password.py

hash_password(plain: str) → str using bcrypt via passlib CryptContext

verify_password(plain: str, hashed: str) → bool

File: app/utils/jwt_handler.py

Use python-jose with HS256

create_access_token(user_id: str) → strpayload: {"sub": user_id, "type": "access", "exp": now + ACCESS_TOKEN_EXPIRE_MINUTES}

create_refresh_token(user_id: str) → strpayload: {"sub": user_id, "type": "refresh", "exp": now + REFRESH_TOKEN_EXPIRE_DAYS}

decode_token(token: str) → dict | Nonereturn None on any error (expired, invalid, etc.)

verify_access_token(token: str) → str | Nonereturns user_id or None

File: app/dependencies.py

get_db(): already exists, keep it

get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/auth/login")), db: AsyncSession = Depends(get_db)) → User:decode token

fetch user from DB

raise HTTPException 401 if anything fails

raise HTTPException 403 if user.is_active is False

File: app/services/auth_service.py

All functions are async and receive db: AsyncSession

get_user_by_email(db, email: str) → User | None

get_user_by_id(db, user_id: str) → User | None

create_user(db, data: UserRegister) → Usercheck email not already taken (raise HTTPException 400 if taken)

hash password

create User object, add to db, commit, refresh, return

authenticate_user(db, email: str, password: str) → User | Noneget user by email

verify password

return user or None

build_token_response(user: User) → TokenResponsecreate access + refresh tokens

return TokenResponse(access_token, refresh_token, token_type, user=UserResponse.model_validate(user))

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 5 — Auth Router

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

FastAPI backend, Academic Success Platform

auth_service functions: create_user, authenticate_user, build_token_response

jwt_handler functions: decode_token

All schemas imported from app.schemas.user

Add router to app/main.py after creating it

File: app/routers/auth.py

Create APIRouter with prefix="/api/auth", tags=["Authentication"]

Endpoints:

POST /register

Request body: UserRegister

Call create_user (raises 400 if email taken)

Call build_token_response

Return: TokenResponse

Status 201

POST /login

Request body: UserLogin

Call authenticate_user

If None → raise HTTPException 401 "Invalid email or password"

Return: TokenResponse

Status 200

POST /refresh

Request body: {"refresh_token": str}

Decode token, check type == "refresh"

Fetch user from DB

Return new TokenResponse

Status 200

Raise 401 if invalid

GET /me

Requires: current_user from get_current_user dependency

Return: UserResponse

After creating the router, update app/main.py:

Import the auth router

app.include_router(auth_router)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 6 — GPA Service + Academic Router

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:
FastAPI backend, Academic Success Platform
GPA system is out of 5.0 (Saudi/Egyptian university system)
Grade scale:
A+ = 5.0, A = 4.75, A- = 4.5
B+ = 4.25, B = 4.0, B- = 3.75
C+ = 3.5, C = 3.0, C- = 2.75
D+ = 2.5, D = 2.0
F = 0.0

Models: User, Course, GPA, StudyPlan
Cache functions in app.cache
TOTAL_CREDIT_HOURS_FOR_GRADUATION = 120

File: app/utils/constants.py
GRADE_TO_NUMERIC dict with all grades above
TOTAL_CREDIT_HOURS = 120

File: app/services/gpa_service.py
All functions async, receive db: AsyncSession

- calculate_semester_gpa(db, user_id: str, semester: str) -> float
  Formula: sum(grade_numeric \* credit_hours) / sum(credit_hours)
  Return 0.0 if no records
- calculate_cumulative_gpa(db, user_id: str) -> float
  Same formula across ALL completed courses
  Cache result in Redis with key cache_key_gpa(user_id), TTL 24h
  Return cached value if exists
- get_gpa_history(db, user_id: str) -> list[dict]
  Return list of {semester, gpa, credit_hours} sorted by year, semester_number
- invalidate_gpa_cache(user_id: str)
  Delete the cached GPA for this user (call after adding new grades)

File: app/services/academic_service.py
All functions async, receive db: AsyncSession

- get_completed_course_codes(db, user_id: str) -> set[str]
  Return set of course codes the user has completed (grade != "F")
- get_course_status(completed_codes: set, course: Course) -> str
  Return "completed" if course.code in completed_codes
  Return "locked" if any prerequisite not in completed_codes
  Return "available" otherwise
- get_full_study_plan(db, user_id: str, major: str) -> StudyPlanResponse
  Fetch all courses for the major
  For each course, determine status using get_course_status
  Group into: completed, available, locked, in_progress
  Return StudyPlanResponse
- calculate_graduation_percentage(completed_credits: int) -> float
  Return min(round(completed_credits / TOTAL_CREDIT_HOURS \* 100, 1), 100.0)
- get_dashboard_data(db, user_id: str) -> DashboardResponse
  Fetch user, calculate cumulative_gpa, build response
  Include current courses (status = "in_progress")

ADDITIONAL WORKLOAD PLANNER LOGIC IN academic_service.py:

- calculate_semester_workload(db, user_id: str, semester: str) -> str:
  Sum credit_hours for all StudyPlan records with status="in_progress" and planned_semester=semester.
  If total < 12 return "Light", if 12 <= total <= 18 return "Optimal", if total > 18 return "Heavy".
- add_completed_course_grade(db, user_id: str, course_id: str, grade: str, semester: str, year: int, semester_number: int):
  1. Insert record into GPA table with numeric grade mapping from GRADE_TO_NUMERIC.
  2. Update StudyPlan record for this course for this user to status="completed".
  3. Update user.completed_credit_hours dynamically based on course credit hours.
  4. Call invalidate_gpa_cache(user_id).
- activate_semester_planner(db, user_id: str, semester: str):
  Update all StudyPlan records for this user in this specific planned_semester from "planned" or "available" to "in_progress".

File: app/routers/academic.py
APIRouter prefix="/api/academic", tags=["Academic"]
All endpoints require get_current_user dependency

- GET /dashboard -> DashboardResponse
- GET /gpa -> GPAResponse (semester_gpa of latest semester + cumulative)
- GET /gpa/history -> list of {semester, gpa}
- GET /plan -> StudyPlanResponse (all courses grouped by status)
- GET /plan/available -> list[StudyPlanCourse]
- GET /plan/completed -> list[StudyPlanCourse]

ADDITIONAL PLANNER & GPA ENDPOINTS TO IMPLEMENT:

- POST /gpa/add -> Request body: {course_id: UUID, grade: str, semester: str, year: int, semester_number: int}. Calls add_completed_course_grade. Returns status success. Status 201.
- POST /plan/activate -> Request body: {semester: str}. Calls activate_semester_planner. Returns status success. Status 200.
- GET /plan/workload/{semester} -> Returns {"total_hours": int, "status": "Light/Optimal/Heavy"} by calling calculate_semester_workload.

Register router in app/main.py
Use precise Pydantic schemas for request validation. Ensure proper error handling and async flow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 7 — RAG Service (Embeddings)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

FastAPI backend, Academic Success Platform

Using OpenAI text-embedding-3-small (1536 dimensions)

pgvector is installed as PostgreSQL extension

The goal: store student data as text chunks with embeddings,

then at query time find the most relevant chunks to send as context to the LLM

Settings: settings.openai_api_key, settings.openai_embedding_model

File: app/models/embedding.py

Model: StudentEmbedding

Fields:

id: UUID primary key

student_id: UUID ForeignKey("users.id"), indexed

chunk_type: String(50) (e.g. "profile", "completed_courses", "gpa_summary", "study_plan")

chunk_text: Text (the raw text that was embedded)

embedding: use pgvector's Vector(1536) column type from pgvector.sqlalchemy

created_at: DateTime

Add table-level index for vector similarity search:

from sqlalchemy import Index

Index("embedding_cosine_idx", StudentEmbedding.embedding, postgresql_using="ivfflat",

postgresql_ops={"embedding": "vector_cosine_ops"})

Add to app/models/init.py

File: app/services/rag_service.py

All functions async

generate_student_chunks(user: User, completed_courses: list, gpa_data: dict) → list[dict]

Creates human-readable text chunks from student data.

Return list of {"chunk_type": str, "chunk_text": str}

Chunks to generate:

"profile": "Student name is {name}. Major: {major}. University: {university}.

Current level: year {level}. Enrolled in {enrollment_year}.

Completed {completed_credit_hours} of {total_credit_hours} credit hours."

"gpa_summary": "Current cumulative GPA is {gpa} out of 5.0.

Semester breakdown: {list each semester and its GPA}."

"completed_courses": "Completed courses: {list course names and grades}.

Total {n} courses completed successfully."

"study_plan": "Available courses to take next: {list available course names}.

Locked courses (prerequisites not met): {list locked course names}."

embed_text(text: str) → list[float]

Call OpenAI embeddings API

Use model: settings.openai_embedding_model

Return the embedding vector

index_student_data(db, user_id: str)

Fetch user, completed courses, gpa data

Generate chunks

For each chunk:

embed the text

Delete existing embedding of same chunk_type for this student

Insert new StudentEmbedding record

Commit all changes

similarity_search(db, student_id: str, query: str, top_k: int = 4) → list[str]

Embed the query

Use pgvector cosine similarity to find top_k matching chunks for this student

Raw SQL via db.execute():

SELECT chunk_text FROM student_embeddings

WHERE student_id = :student_id

ORDER BY embedding <=> :query_vector

LIMIT :top_k

Return list of chunk_text strings

assemble_context(db, student_id: str, query: str) → str

Call similarity_search

Join results with "\n\n"

Return formatted context string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 8 — AI Service + Chat Router (SSE Streaming)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

FastAPI backend, Academic Success Platform

OpenAI SDK v1.x (new interface: client.chat.completions.create)

Streaming via Server-Sent Events (SSE)

Rate limit: MAX_AI_REQUESTS_PER_DAY from settings

rag_service.assemble_context provides student context

ChatHistory model stores conversation

Cache functions: increment(key), get_counter(key) from app.cache

File: app/services/ai_service.py

get_system_prompt(user: User) → str

Return this prompt (fill in from user object):

"""

You are an AI academic advisor for {name}, a {level}-year student

majoring in {major} at {university}.

You have access to the student's academic profile, completed courses,

GPA history, and study plan. Use this context to give personalized,

accurate advice.

Always be encouraging and constructive. When suggesting courses,

consider prerequisites and the student's GPA. Answer in the same

language the student uses (Arabic or English).

Context about the student:

{context}

"""

Note: context will be inserted at query time, not here.

check_rate_limit(user_id: str) → bool

key = cache_key_ai_rate(user_id)

count = await get_counter(key)

Return count < settings.max_ai_requests_per_day

increment_rate_limit(user_id: str)

await increment(cache_key_ai_rate(user_id), ttl=86400)

stream_ai_response(user: User, message: str, context: str) → AsyncGenerator[str, None]

Build system prompt inserting context

Call openai.chat.completions.create with stream=True

model: settings.openai_chat_model

messages: [{"role": "system", "content": system_prompt}, {"role": "user", "content": message}]

For each chunk in stream:

extract token text

yield token

save_chat_history(db, user_id: str, user_message: str, full_response: str, tokens: int)

Create ChatHistory record, add, commit

File: app/routers/ai.py

APIRouter prefix="/api/ai", tags=["AI Advisor"]

All endpoints require get_current_user

POST /ask

Request body: ChatRequest (message: str)

Check rate limit → 429 if exceeded with message "Daily limit reached. Try again tomorrow."

Get context from rag_service.assemble_context

Increment rate limit counter

Build SSE generator:async def generate(): full_response = "" async for token in stream_ai_response(current_user, message, context): full_response += token data = json.dumps({"token": token, "done": False}) yield f"data: {data}\n\n" await save_chat_history(db, user_id, message, full_response, 0) yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

GET /history

Optional query params: limit=20, offset=0

Return ChatHistoryResponse

GET /limit

Return {"used": int, "max": int, "remaining": int}

Register router in app/main.py

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 9 — Seed Data Script

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

FastAPI backend, Academic Success Platform

All models exist: User, Course, GPA, StudyPlan, ChatHistory

This script populates the database with realistic test data

Run with: python scripts/seed.py

File: scripts/seed.py

Create an async main() function that:

Creates 10 Computer Science courses:

CS101 - Introduction to Programming (3 credits, semester 1, no prerequisites)

CS102 - Data Structures (3 credits, semester 2, prerequisites: ["CS101"])

CS201 - Algorithms (3 credits, semester 3, prerequisites: ["CS102"])

CS202 - Database Systems (3 credits, semester 3, prerequisites: ["CS101"])

CS301 - Software Engineering (3 credits, semester 5, prerequisites: ["CS201", "CS202"])

CS302 - Operating Systems (3 credits, semester 5, prerequisites: ["CS201"])

CS303 - Computer Networks (3 credits, semester 6, prerequisites: ["CS302"])

CS401 - Machine Learning (3 credits, semester 7, prerequisites: ["CS201"])

CS402 - Web Development (3 credits, semester 6, prerequisites: ["CS202"])

CS499 - Graduation Project (6 credits, semester 8, prerequisites: ["CS301", "CS401"])

Creates 1 test student:

email: test@academic.com

password: Test1234!

name: Ahmed Ali

major: Computer Science

level: 3

enrollment_year: 2022

total_credit_hours: 120

completed_credit_hours: 30

Creates GPA records for Ahmed (first 4 courses completed):

CS101: grade A (4.75), Fall 2022, semester_number=1

CS102: grade B+ (4.25), Spring 2023, semester_number=2

CS201: grade A+ (5.0), Fall 2023, semester_number=3

CS202: grade A (4.75), Fall 2023, semester_number=3

Creates StudyPlan records for Ahmed:

CS101, CS102, CS201, CS202 → status="completed"

CS301, CS302, CS402 → status="available" (prerequisites met)

CS303, CS401, CS499 → status="locked" (prerequisites not met)

Print "✓ Seed complete" when done

If uv or Poetry is not used, run with:

cd academic-backend

python -m scripts.seed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 10 — Tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

FastAPI backend, Academic Success Platform

Using pytest + pytest-asyncio

Test database: use SQLite in-memory (for speed) or a separate test PostgreSQL DB

The seed data from Prompt 9 represents the expected state

File: tests/conftest.py

Create async test client fixture using httpx.AsyncClient and ASGITransport

Create test_db fixture that creates fresh tables before each test and drops after

Create test_user fixture that creates the Ahmed Ali user and returns (user, token)

File: tests/test_auth.py

Test cases:

test_register_success: POST /api/auth/register with valid data → 201, has access_token

test_register_duplicate_email: register same email twice → second returns 400

test_login_success: POST /api/auth/login → 200, has access_token

test_login_wrong_password: → 401

test_get_me: GET /api/auth/me with valid token → 200, returns user data

test_get_me_no_token: GET /api/auth/me without token → 401

File: tests/test_academic.py

Test cases (all require auth token):

test_dashboard: GET /api/academic/dashboard → 200, has current_gpa, graduation_percentage

test_gpa: GET /api/academic/gpa → 200, has cumulative_gpa as float

test_study_plan: GET /api/academic/plan → 200, has completed/available/locked lists

test_available_courses: GET /api/academic/plan/available → 200, list not empty

File: tests/test_gpa_calculator.py

Unit tests for calculate_cumulative_gpa logic:

test_gpa_calculation_correct: given grades A+(5.0,3cr) B+(4.25,3cr) → expected GPA = 4.625

test_gpa_empty_no_error: no grades → returns 0.0

test_gpa_all_f: all F grades → returns 0.0

Run all tests:

pytest tests/ -v --asyncio-mode=auto

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROMPT 11 (BONUS) — Fix & Review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use this prompt when you finish building and want a full review.

You are reviewing a FastAPI backend for an Academic Success Platform.

The project uses: FastAPI, SQLAlchemy 2.0 async, PostgreSQL + pgvector, Redis, OpenAI SDK v1.

Review the entire codebase and check for:

Missing imports or circular imports

Async functions called without await

SQLAlchemy sessions not closed or committed properly

Missing error handling (bare except, no HTTPException codes)

Pydantic v2 compatibility issues (e.g. using .dict() instead of .model_dump())

Any endpoint missing authentication that should have it

The RAG similarity search query — confirm pgvector syntax is correct

SSE streaming — confirm the generator yields proper "data: ...\n\n" format

Redis cache — confirm TTL is set correctly for rate limiting

CORS settings — confirm localhost:3000 and localhost:5173 are in allowed_origins

For each issue found: show the file, the problem, and the fix.

If everything looks correct, confirm with "✓ All checks passed".
