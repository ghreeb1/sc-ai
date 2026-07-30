PROMPT 1 — Project Structure + Docker Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are building the backend for an Academic Success Platform.
This is a FastAPI application with PostgreSQL (pgvector) and Redis.

Create the full project structure with all necessary empty files and folders,
then fill the listed files with working content.

Project structure:

academic-backend/
├── app/
│ ├── **init**.py
│ ├── main.py
│ ├── config.py
│ ├── database.py
│ ├── cache.py
│ ├── dependencies.py
│ ├── models/**init**.py
│ ├── schemas/**init**.py
│ ├── routers/**init**.py
│ ├── services/**init**.py
│ └── utils/**init**.py
├── alembic/ # migrations live here (prod schema owner)
│ └── versions/
├── alembic.ini
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

- PostgreSQL service using image: pgvector/pgvector:pg16 (NOT pg16-latest)
- Redis service using image: redis:7-alpine
- Both with health checks and named volumes
- Network: academic_network

requirements.txt with these exact packages:
fastapi==0.104.1, uvicorn[standard]==0.24.0, python-dotenv==1.0.0
sqlalchemy==2.0.23, alembic==1.13.0, asyncpg==0.29.0, psycopg2-binary==2.9.9, pgvector==0.2.1
redis==5.0.1
pydantic==2.5.0, pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0, passlib[bcrypt]==1.7.4, bcrypt==4.0.1 # 4.0.1 avoids passlib **about** break
openai==1.3.9
httpx==0.25.2, aiofiles==23.2.1
email-validator==2.1.0
pytest==7.4.3, pytest-asyncio==0.21.1

.env.example and .env with these variables:
DATABASE_URL=postgresql+asyncpg://academic_user:academic_password@localhost:5432/academic_db
SYNC_DATABASE_URL=postgresql+psycopg2://academic_user:academic_password@localhost:5432/academic_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
OPENAI_API_KEY=sk-your-key-here
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIM=1536
MAX_AI_REQUESTS_PER_DAY=10
WORKLOAD_LIGHT_MAX=12 # <=12 credit hours = Light
WORKLOAD_OPTIMAL_MAX=18 # 13–18 = Optimal, >18 = Heavy
DEBUG=True
ENVIRONMENT=development
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]

app/config.py:

- Pydantic v2 BaseSettings class named Settings (from pydantic_settings import BaseSettings, SettingsConfigDict).
- IMPORTANT: type allowed_origins as List[str] so pydantic-settings JSON-parses the env value correctly.
- Include sync_database_url, embedding_model, embedding_dim, workload_light_max, workload_optimal_max.
- Create global instance: settings = Settings()

app/database.py:

- Use SQLAlchemy 2.0 typed style: `class Base(DeclarativeBase): pass` (NOT declarative_base()).
- create_async_engine from settings.database_url (asyncpg).
- async_sessionmaker factory (expire_on_commit=False).
- async get_db() dependency that yields an AsyncSession and guarantees close.
- async init_db() — DEV/TEST ONLY bootstrap: 1. await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector")) 2. await conn.run_sync(Base.metadata.create_all)
  Add a docstring stating Alembic is the source of truth in production; init_db() is a dev convenience only.
  Do NOT call both Alembic and init_db() against the same prod DB.

app/cache.py:

- Global redis_client; async init_redis() via redis.asyncio.from_url(); async close_redis()
- async get_cache(key) -> dict | None (JSON deserialize)
- async set_cache(key, value, ttl=3600) (JSON serialize)
- async delete_cache(key)
- async increment(key, ttl=86400) -> int (rate limiting)
- Helpers: cache_key_gpa(user_id), cache_key_ai_rate(user_id)

app/main.py:

- FastAPI app, title "Academic Success Platform API", docs at /api/docs
- @asynccontextmanager lifespan: init_redis() on startup; init_db() ONLY when settings.environment != "production"; close_redis() on shutdown
- CORSMiddleware with settings.allowed_origins
- GET /health -> {"status": "ok", "environment": settings.environment}
- Do not add routers yet.

## Use type hints everywhere. Add docstrings to every function.

PROMPT 2 — Database Models
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- FastAPI backend, SQLAlchemy 2.0 ASYNC, PostgreSQL.
- Base is imported from app.database (class Base(DeclarativeBase)).
- Use Mapped[...] / mapped_column(...) typed syntax everywhere (true 2.0 style).
- UUID primary keys (default=uuid4). ALL timestamps are timezone-aware UTC:
  use mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)).
  Do NOT use datetime.utcnow (deprecated / naive).
- Define relationships EXPLICITLY using string targets ("Course", "User") to avoid circular imports.
- Status semantics (CRITICAL): StudyPlan.status stores the LIFECYCLE only:
  planned / in_progress / completed. "available" and "locked" are NOT stored —
  they are computed at read-time from prerequisites + completed courses.

Create these 5 model files inside app/models/:

File: app/models/user.py
Model: User
id: UUID PK, default=uuid4
email: String(255), unique, indexed, not null
password_hash: String(255), not null
name: String(255), not null
major: String(255), not null
university: String(255), nullable
level: Integer, not null, default=1
enrollment_year: Integer, not null
is_active: Boolean, default=True # Denormalized counters maintained atomically by the service layer. # SINGLE SOURCE OF TRUTH for completed credits is the GPA table; these are caches.
total_credit_hours: Integer, default=0
completed_credit_hours: Integer, default=0
created_at / updated_at: DateTime(timezone=True), tz-aware UTC, updated_at has onupdate
Relationships:
gpa_records: list["GPA"] back_populates="user", cascade="all, delete-orphan"
study_plan: list["StudyPlan"] back_populates="user", cascade="all, delete-orphan"
chat_history:list["ChatHistory"] back_populates="user", cascade="all, delete-orphan"

File: app/models/course.py
Model: Course
id: UUID PK
code: String(20), unique, indexed
name: String(255), not null
credit_hours: Integer, not null
major: String(255), indexed
is_elective: Boolean, default=False
semester_recommended: Integer, nullable
prerequisites: JSON, default=list (list of course codes)
created_at: DateTime(timezone=True)

File: app/models/gpa.py
Model: GPA (one course-completion / grade record)
id: UUID PK
user_id: UUID FK("users.id", ondelete="CASCADE"), indexed
course_id: UUID FK("courses.id")
grade: String(3)
grade_numeric: Float
credit_hours: Integer # snapshot at time of completion (historical accuracy)
semester: String(20) # display label, e.g. "Fall 2023"
year: Integer
semester_number: Integer # CANONICAL semester key, shared with StudyPlan
created_at: DateTime(timezone=True)
Relationships:
user: "User" back_populates="gpa_records"
course: "Course"
Constraints:
UniqueConstraint(user_id, course_id, name="uq_user_course_grade") # If retakes are required later, revisit this constraint explicitly.

File: app/models/study_plan.py
Model: StudyPlan
id: UUID PK
user_id: UUID FK("users.id", ondelete="CASCADE"), indexed
course_id: UUID FK("courses.id")
status: String(20), default="planned" # LIFECYCLE ONLY: planned / in_progress / completed. # available / locked are computed at read-time, never stored here.
semester_number: Integer, nullable # CANONICAL semester key (matches GPA.semester_number)
planned_semester: String(20), nullable # optional display label, e.g. "Semester 1"
created_at / updated_at: DateTime(timezone=True)
Relationships:
user: "User" back_populates="study_plan"
course: "Course"
Constraints:
UniqueConstraint(user_id, course_id, name="uq_user_course_plan") # one row per (student, course) → deterministic workload + state machine

File: app/models/chat.py
Model: ChatHistory
id: UUID PK
user_id: UUID FK("users.id", ondelete="CASCADE"), indexed
user_message: Text, not null
ai_response: Text, not null
tokens_used: Integer, default=0
created_at: DateTime(timezone=True), indexed
Relationships:
user: "User" back_populates="chat_history"

Update app/models/**init**.py to import all models (User, Course, GPA, StudyPlan,
ChatHistory) so SQLAlchemy discovers them for metadata/migrations.

## Add **repr** to every model. Use proper SQLAlchemy 2.0 typed syntax (Mapped/mapped_column).

PROMPT 3 — Pydantic Schemas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- FastAPI backend, Pydantic v2.
- Every response schema reading from ORM uses model_config = ConfigDict(from_attributes=True).
- Nested ORM objects (e.g. course) require the matching SQLAlchemy relationship to be
  EAGER-LOADED (selectinload) in the query layer — never rely on async lazy loading.
- STATUS RULE: no request schema may EVER include a client-settable `status` field.
  Status transitions are server-driven only (planner / GPA calculator).

File: app/schemas/user.py
Define in this order: UserResponse first (others nest it).
UserRegister (request): email: EmailStr; password: str(min_length=8); name: str(min_length=2);
major: str; university: Optional[str]=None; level: int(ge=1,le=4); enrollment_year: int(ge=2000,le=2030)
UserLogin (request): email: EmailStr; password: str
UserResponse (from ORM): id: UUID; email: str; name: str; major: str; university: Optional[str];
level: int; enrollment_year: int; total_credit_hours: int; completed_credit_hours: int; created_at: datetime
TokenResponse: access_token: str; refresh_token: str; token_type: str="bearer"; user: UserResponse

File: app/schemas/academic.py
(import UserResponse from app.schemas.user — no cycle, user.py never imports academic.py)
Define in this order so nesting resolves: CourseResponse → GPAEntry → GPAResponse →
StudyPlanCourse → StudyPlanResponse → DashboardResponse.

CourseResponse (from ORM): id: UUID; code: str; name: str; credit_hours: int; major: str;
is_elective: bool; semester_recommended: Optional[int]; prerequisites: list[str]
GPAEntry (from ORM): id: UUID; grade: str; grade_numeric: float; credit_hours: int;
semester: str; year: int; semester_number: int; course: CourseResponse
GPAResponse: semester_gpa: float; cumulative_gpa: float; total_credits_completed: int; history: list[GPAEntry]

StudyPlanCourse (from ORM): course: CourseResponse; status: str; planned_semester: Optional[str] # status here is the stored lifecycle value (planned/in_progress/completed)

StudyPlanResponse:
completed: list[StudyPlanCourse] # status == completed
in_progress: list[StudyPlanCourse] # status == in_progress
available: list[StudyPlanCourse] # status == planned AND all prerequisites completed (COMPUTED)
locked: list[StudyPlanCourse] # status == planned AND prerequisites unmet (COMPUTED) # NOTE: "available"/"locked" are derived projections of `planned` courses. # The planner service computes them; they are never persisted to StudyPlan.status.

DashboardResponse:
user: UserResponse
semester_gpa: float # aligned name (was current_gpa) — same concept as GPAResponse.semester_gpa
cumulative_gpa: float
completed_credit_hours: int
total_credit_hours: int
graduation_percentage: float
current_courses: list[StudyPlanCourse] # the in_progress set # Optional but recommended for Rule 1 (add when WorkloadResponse is defined): # workload_tier: str ("Light" | "Optimal" | "Heavy") # workload_credit_hours: int

File: app/schemas/chat.py
ChatRequest (request): message: str(min_length=3, max_length=1000)
ChatMessageResponse (from ORM): id: UUID; user_message: str; ai_response: str;
tokens_used: int; created_at: datetime
ChatHistoryResponse: messages: list[ChatMessageResponse]; total: int

# NOTE: the live RAG advisor returns a streaming SSE response, NOT ChatMessageResponse.

# These schemas cover stored-history retrieval only; the SSE endpoint is defined in a later batch.

---

PROMPT 4 — Auth Utils + Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- FastAPI backend, Academic Success Platform.
- settings imported from app.config; AsyncSession from SQLAlchemy 2.0.
- User model in app.models.user. Schemas in app.schemas.user.
- All datetimes are timezone-aware UTC: use datetime.now(timezone.utc). Never datetime.utcnow.

File: app/utils/password.py

- CryptContext(schemes=["bcrypt"], deprecated="auto")
- hash_password(plain: str) -> str
- verify_password(plain: str, hashed: str) -> bool

File: app/utils/jwt_handler.py

- python-jose, HS256, key=settings.secret_key.
- create_access_token(user_id: str) -> str
  payload: {"sub": user_id, "type": "access",
  "exp": now(utc) + timedelta(minutes=settings.access_token_expire_minutes)}
- create_refresh_token(user_id: str) -> str
  payload: {"sub": user_id, "type": "refresh",
  "exp": now(utc) + timedelta(days=settings.refresh_token_expire_days)}
- decode_token(token: str) -> dict | None
  Return None on ANY error (expired, invalid signature, malformed).
- verify_access_token(token: str) -> str | None
  Decode, REQUIRE payload["type"] == "access", return payload["sub"] else None.
- verify_refresh_token(token: str) -> str | None
  Decode, REQUIRE payload["type"] == "refresh", return payload["sub"] else None.

File: app/dependencies.py

- Keep existing get_db().
- oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
- get_current_user(token = Depends(oauth2_scheme), db = Depends(get_db)) -> User:
  1. user_id = verify_access_token(token) # MUST use access-token verifier (type check)
  2. if user_id is None -> raise HTTPException 401 "Could not validate credentials"
  3. fetch user by id; if None -> raise 401
  4. if not user.is_active -> raise HTTPException 403 "Inactive user"
  5. return user
     (Do NOT use bare decode_token here — a refresh token must not authenticate as access.)

File: app/services/auth_service.py
All functions async, receive db: AsyncSession.

- get_user_by_email(db, email: str) -> User | None
- get_user_by_id(db, user_id: str) -> User | None
- create_user(db, data: UserRegister) -> User
  - if get_user_by_email returns a user -> raise HTTPException 400 "Email already registered"
  - hash password, build User, add, commit, refresh, return
- authenticate_user(db, email: str, password: str) -> User | None
  - get user by email; if None return None
  - verify_password; return user or None
- build_token_response(user: User) -> TokenResponse
  - create access + refresh tokens
  - return TokenResponse(access_token=..., refresh_token=...,
    token_type="bearer", user=UserResponse.model_validate(user))

## Use type hints and docstrings everywhere.

PROMPT 5 — Auth Router
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- auth_service: create_user, authenticate_user, build_token_response, get_user_by_id
- jwt_handler: verify_refresh_token
- Schemas from app.schemas.user.

FIRST, add a request schema to app/schemas/user.py:

- RefreshRequest (request): refresh_token: str

File: app/routers/auth.py
APIRouter(prefix="/api/auth", tags=["Authentication"])

POST /register (status 201)
body: UserRegister -> create_user (raises 400 if email taken) -> build_token_response -> TokenResponse

POST /login (status 200)
body: UserLogin -> authenticate_user
if None -> raise HTTPException 401 "Invalid email or password"
-> build_token_response -> TokenResponse

POST /refresh (status 200)
body: RefreshRequest
user_id = verify_refresh_token(refresh_token) # type check enforced inside
if None -> raise HTTPException 401 "Invalid refresh token"
fetch user; if None or not is_active -> raise 401
-> build_token_response -> TokenResponse (new access + refresh)

GET /me
current_user = Depends(get_current_user) -> return UserResponse

## Then update app/main.py: import the auth router and app.include_router(router).

PROMPT 6 — GPA Service + Academic Router
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- FastAPI backend, Academic Success Platform. GPA scale is out of 5.0.
- Grade scale (GRADE_TO_NUMERIC):
  A+=5.0, A=4.75, A-=4.5, B+=4.25, B=4.0, B-=3.75,
  C+=3.5, C=3.0, C-=2.75, D+=2.5, D=2.0, F=0.0
- Models: User, Course, GPA, StudyPlan. Cache fns in app.cache. settings in app.config.

CRITICAL ARCHITECTURE RULES (must be honored):

1. SINGLE SOURCE OF TRUTH for completion = the GPA table. StudyPlan.status and
   User.completed_credit_hours are derived caches, updated ATOMICALLY when a grade is added.
2. StudyPlan.status stores LIFECYCLE ONLY: planned / in_progress / completed.
   "available" and "locked" are COMPUTED at read-time, never stored.
3. A FAILING grade ("F") records the grade for GPA but DOES NOT complete the course:
   it does not set status="completed", does not add completed_credit_hours,
   and does not satisfy prerequisites.
4. Semester identity is the canonical integer semester_number (NOT planned_semester string).
5. No request schema may contain a client-settable `status` field.

File: app/utils/constants.py

- GRADE_TO_NUMERIC: dict (all grades above)
- TOTAL_CREDIT_HOURS = 120 # graduation requirement
- PASSING_GRADES = set of all grades except "F" # used for completion checks

ADD request schemas to app/schemas/academic.py (NO status field anywhere):

- GradeCreateRequest: course_id: UUID; grade: str; semester: str; year: int; semester_number: int
- SemesterActivateRequest: semester_number: int
- WorkloadResponse: total_hours: int; tier: str # "Light" | "Optimal" | "Heavy"

File: app/services/gpa_service.py (all async, receive db: AsyncSession)

- calculate_semester_gpa(db, user_id, semester_number: int) -> float
  Credit-weighted: sum(grade_numeric\*credit_hours)/sum(credit_hours) over that semester. 0.0 if none.
- calculate_cumulative_gpa(db, user_id) -> float
  Same formula over ALL grade records. Check cache_key_gpa(user_id) first; on miss compute,
  set_cache(..., ttl=86400), return. (Note: F rows count toward GPA but contribute 0.0.)
- get_latest_semester_number(db, user_id) -> int | None
  Max semester_number among the user's grade records (tie-break by max year).
- get_gpa_entries(db, user_id) -> list[GPA]
  Individual grade records WITH selectinload(GPA.course). Used to build GPAResponse.history (list[GPAEntry]).
- get_gpa_history(db, user_id) -> list[dict]
  Per-semester aggregate: [{semester, semester_number, gpa, credit_hours}] sorted by year, semester_number.
- invalidate_gpa_cache(user_id) -> None
  delete_cache(cache_key_gpa(user_id)).

File: app/services/academic_service.py (all async, receive db: AsyncSession)

- get_completed_course_codes(db, user_id) -> set[str]
  Course codes from GPA records whose grade in PASSING_GRADES (F excluded). Source of truth for prereqs.

- compute_planned_availability(completed_codes: set[str], course: Course) -> str
  For a PLANNED course only: return "locked" if any prerequisite code not in completed_codes,
  else "available". (Pure function; does not touch DB or status.)

- get_full_study_plan(db, user_id, major) -> StudyPlanResponse
  Read the user's StudyPlan rows WITH selectinload(StudyPlan.course).
  Bucket by stored lifecycle status:
  status == "completed" -> completed
  status == "in_progress" -> in_progress
  status == "planned" -> compute_planned_availability(...) => available OR locked
  Return StudyPlanResponse(completed, in_progress, available, locked).
  (Read from the student's plan, NOT the raw course catalog.)

- calculate_graduation_percentage(completed_credits: int) -> float
  min(round(completed_credits / TOTAL_CREDIT_HOURS \* 100, 1), 100.0)

- calculate_semester_workload(db, user_id, semester_number: int) -> WorkloadResponse
  total = sum(Course.credit_hours) over StudyPlan rows where status=="in_progress"
  AND semester_number == given (join StudyPlan->Course).
  tier: total <= settings.workload_light_max -> "Light"
  total <= settings.workload_optimal_max -> "Optimal"
  else -> "Heavy"
  Return WorkloadResponse(total_hours=total, tier=tier).
  (Thresholds come from config — do not hardcode 12/18.)

- get_dashboard_data(db, user_id) -> DashboardResponse
  Fetch user; latest = get_latest_semester_number; semester_gpa = calculate_semester_gpa(latest)
  (0.0 if no semesters); cumulative_gpa = calculate_cumulative_gpa;
  graduation_percentage from user.completed_credit_hours;
  current_courses = in_progress StudyPlan rows (selectinload course). Build DashboardResponse.

- add_completed_course_grade(db, user_id, data: GradeCreateRequest) -> None
  ATOMIC — perform all writes in ONE transaction, single commit; rollback on any error: 1. Resolve grade_numeric from GRADE_TO_NUMERIC (raise 400 if grade unknown). 2. Load Course (for credit_hours); ensure a StudyPlan row exists for (user, course)
  — if missing, raise 404 "Course not in study plan". 3. Guard duplicates: if a GPA row already exists for (user, course), raise 400
  "Grade already recorded for this course" (respects the unique constraint; retakes are out of scope). 4. Insert GPA row (snapshot credit_hours, semester, year, semester_number). 5. IF grade in PASSING_GRADES:
  set StudyPlan.status = "completed"
  user.completed_credit_hours += course.credit_hours
  ELSE (grade == "F"):
  leave StudyPlan.status unchanged (course remains in_progress for retake)
  do NOT change completed_credit_hours 6. commit once.
  After successful commit: invalidate_gpa_cache(user_id).

- activate_semester_planner(db, user_id, semester_number: int) -> None
  Flip StudyPlan rows for this user with semester_number == given AND status == "planned"
  to status == "in_progress" — but SKIP courses whose prerequisites are not met
  (use get_completed_course_codes + compute_planned_availability == "locked" => skip).
  Single commit.

File: app/routers/academic.py
APIRouter(prefix="/api/academic", tags=["Academic"]); ALL endpoints Depends(get_current_user).

- GET /dashboard -> DashboardResponse
- GET /gpa -> GPAResponse
  semester_gpa = latest semester via get_latest_semester_number/calculate_semester_gpa;
  cumulative_gpa; total_credits_completed = user.completed_credit_hours;
  history = [GPAEntry] built from get_gpa_entries (course eager-loaded).
- GET /gpa/history -> list[dict] (from get_gpa_history)
- GET /plan -> StudyPlanResponse
- GET /plan/available -> list[StudyPlanCourse]
- GET /plan/completed -> list[StudyPlanCourse]
- POST /gpa/add (201) body: GradeCreateRequest -> add_completed_course_grade -> {"status":"success"}
- POST /plan/activate (200) body: SemesterActivateRequest -> activate_semester_planner -> {"status":"success"}
- GET /plan/workload/{semester_number} -> WorkloadResponse

Register the router in app/main.py.
Everywhere a StudyPlanCourse or GPAEntry is serialized, the Course relationship MUST be
selectinload-ed (no async lazy loading). Use precise Pydantic schemas; proper async error handling.

---

PROMPT 7 — RAG Service (Embeddings)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- FastAPI backend, Academic Success Platform.
- OpenAI text-embedding-3-small (1536 dims) via the ASYNC client (AsyncOpenAI).
- pgvector extension is enabled (CREATE EXTENSION vector — done in init_db / first migration).
- Goal: store student data as text chunks + embeddings, then retrieve the most relevant
  chunks at query time as LLM context.
- Settings used: settings.openai_api_key, settings.embedding_model, settings.embedding_dim.
  (Use embedding_model — NOT openai_embedding_model — for naming consistency.)

FIRST, confirm app/config.py exposes:

- embedding_model: str (EMBEDDING_MODEL, default "text-embedding-3-small")
- embedding_dim: int (EMBEDDING_DIM, default 1536)
- openai_chat_model: str (OPENAI_CHAT_MODEL, default "gpt-4o-mini") # used by Prompt 8
  Add OPENAI_CHAT_MODEL=gpt-4o-mini to .env and .env.example if missing.

File: app/models/embedding.py
Model: StudentEmbedding
Fields:
id: UUID PK, default=uuid4
user_id: UUID ForeignKey("users.id", ondelete="CASCADE"), indexed # NOTE: named user_id (NOT student_id) to match every other model's convention.
chunk_type: String(50) # "profile" | "gpa_summary" | "completed_courses" | "study_plan"
chunk_text: Text # the raw text that was embedded
embedding: Vector(settings.embedding_dim) # from pgvector.sqlalchemy import Vector
created_at: DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
Relationship: user: "User" (add embeddings: list["StudentEmbedding"] back_populates +
cascade="all, delete-orphan" on the User model).

Vector index — use HNSW (works on empty tables, no training step), cosine ops:
from sqlalchemy import Index
Index(
"embedding_hnsw_cosine_idx",
StudentEmbedding.embedding,
postgresql_using="hnsw",
postgresql_ops={"embedding": "vector_cosine_ops"},
)
Add `from app.models.embedding import StudentEmbedding` to app/models/**init**.py
so it is discovered by metadata/migrations.

File: app/services/rag_service.py

- Module-level: aclient = AsyncOpenAI(api_key=settings.openai_api_key)
  (ALL OpenAI calls are async — never use the sync client inside async code.)

- generate_student_chunks(user: User, completed_courses: list, in_progress_courses: list,
  available_course_names: list[str], locked_course_names: list[str],
  gpa_data: dict, workload_tier: str) -> list[dict]
  Pure function (no I/O). Returns list of {"chunk_type": str, "chunk_text": str}:
  "profile":
  "Student name is {name}. Major: {major}. University: {university}.
  Current level: year {level}. Enrolled in {enrollment_year}.
  Completed {completed_credit_hours} of {total_credit_hours} planned credit hours."
  "gpa_summary":
  "Current cumulative GPA is {cumulative_gpa} out of 5.0.
  Semester breakdown: {list each semester_number and its GPA}."
  "completed_courses":
  "Completed courses: {list course name + grade}. Total {n} courses completed successfully."
  "study_plan":
  "Currently in progress this semester ({workload_tier} workload):
  {list in_progress course names}.
  Available courses to take next: {available_course_names}.
  Locked courses (prerequisites not met): {locked_course_names}."
  (study_plan chunk MUST include in_progress + workload tier so the advisor can reason
  about the current semester and Rule 1 workload.)

- embed_text(text: str) -> list[float]
  resp = await aclient.embeddings.create(model=settings.embedding_model, input=text)
  return resp.data[0].embedding

- index_student_data(db, user_id: str) -> None
  1. Fetch the user.
  2. Reuse academic_service / gpa_service to gather: completed courses (GPA passing rows
     with course eager-loaded), in_progress StudyPlan rows (course eager-loaded),
     computed available/locked planned course names, cumulative GPA + per-semester GPA,
     and the workload tier for the active semester.
  3. chunks = generate_student_chunks(...)
  4. For each chunk:
     vector = await embed_text(chunk["chunk_text"])
     DELETE existing StudentEmbedding rows for (user_id, chunk_type)
     INSERT new StudentEmbedding(user_id, chunk_type, chunk_text, embedding=vector)
  5. Single commit at the end.
     (Idempotent: re-running replaces a student's chunks cleanly.)

- similarity_search(db, user_id: str, query: str, top_k: int = 4) -> list[str]
  query_vec = await embed_text(query)
  Use the ORM cosine-distance expression (NOT raw SQL string binding):
  stmt = (
  select(StudentEmbedding.chunk_text)
  .where(StudentEmbedding.user_id == user_id)
  .order_by(StudentEmbedding.embedding.cosine_distance(query_vec))
  .limit(top_k)
  )
  result = await db.execute(stmt)
  return list(result.scalars().all())
  (cosine_distance maps to the <=> operator and matches the vector_cosine_ops HNSW index.)

- assemble_context(db, user_id: str, query: str) -> str
  chunks = await similarity_search(db, user_id, query)
  return "\n\n".join(chunks)

RE-INDEX HOOK (R3 — context freshness). After implementing rag_service, wire re-indexing
into the Batch-2 academic_service so embeddings always reflect real-time data:

- At the END of add_completed_course_grade(...), AFTER the successful commit and cache
  invalidation, call: await index_student_data(db, user_id)
- At the END of activate_semester_planner(...), AFTER its commit, call:
  await index_student_data(db, user_id)
  Wrap each re-index call so an embedding/API failure logs a warning but does NOT roll back
  the already-committed academic transaction (indexing is best-effort, eventually consistent).

---

PROMPT 8 — AI Service + Chat Router (SSE Streaming)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- FastAPI backend, Academic Success Platform.
- OpenAI SDK v1.x ASYNC interface (AsyncOpenAI -> client.chat.completions.create).
- Streaming via Server-Sent Events (SSE).
- Daily rate limit: settings.max_ai_requests_per_day.
- rag_service.assemble_context provides student context. ChatHistory stores conversation.
- Chat model: settings.openai_chat_model.

FIRST, add the missing cache symbol to app/cache.py:

- async get_counter(key: str) -> int
  Read the integer counter at `key` (used for rate limiting).
  Return 0 if the key does not exist. Do NOT increment here.

File: app/services/ai_service.py

- Module-level: aclient = AsyncOpenAI(api_key=settings.openai_api_key)

- get_system_prompt(user: User, context: str) -> str
  Return (filled from the user object + context):
  """
  You are an AI academic advisor for {name}, a {level}-year student
  majoring in {major} at {university}.
  You have access to the student's academic profile, completed courses,
  GPA history, and study plan. Use this context to give personalized,
  accurate advice. Always be encouraging and constructive. When suggesting
  courses, consider prerequisites and the student's GPA. Answer in the same
  language the student uses (Arabic or English).

  Context about the student:
  {context}
  """

- check_rate_limit(user_id: str) -> bool
  count = await get_counter(cache_key_ai_rate(user_id))
  return count < settings.max_ai_requests_per_day

- increment_rate_limit(user_id: str) -> None
  await increment(cache_key_ai_rate(user_id), ttl=86400)

- stream_ai_response(user: User, message: str, context: str) -> AsyncGenerator[str, None]
  system_prompt = get_system_prompt(user, context)
  stream = await aclient.chat.completions.create(
  model=settings.openai_chat_model,
  messages=[{"role": "system", "content": system_prompt},
  {"role": "user", "content": message}],
  stream=True,
  )
  async for chunk in stream:
  token = chunk.choices[0].delta.content or ""
  if token:
  yield token

- save_chat_history(db, user_id: str, user_message: str, full_response: str, tokens: int = 0) -> None
  Create ChatHistory(user_id, user_message, ai_response=full_response, tokens_used=tokens),
  add, commit.
  (tokens defaults 0: streamed usage is not reliably available on openai==1.3.9.)

File: app/routers/ai.py
APIRouter(prefix="/api/ai", tags=["AI Advisor"]); ALL endpoints Depends(get_current_user).

POST /ask
body: ChatRequest (message: str) 1. if not await check_rate_limit(current_user.id):
raise HTTPException(429, "Daily limit reached. Try again tomorrow.") 2. context = await rag_service.assemble_context(db, str(current_user.id), body.message)
(This uses the request-scoped db and runs BEFORE streaming begins — safe.) 3. await increment_rate_limit(str(current_user.id)) 4. CAPTURE PRIMITIVES before building the generator (do NOT reference the request-scoped
`db` or any session-bound ORM object inside the generator):
uid = str(current_user.id)
message = body.message # snapshot only the plain column values needed by the system prompt:
user_snapshot = SimpleNamespace(
id=current_user.id, name=current_user.name, level=current_user.level,
major=current_user.major, university=current_user.university) 5. Build the SSE generator that opens its OWN session for the write:

        async def generate():
            full_response = ""
            try:
                async for token in stream_ai_response(user_snapshot, message, context):
                    full_response += token
                    yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"
            finally:
                # MUST use a fresh session — the request-scoped `db` is already closed
                # by the time the StreamingResponse finishes iterating this generator.
                async with async_session() as db_local:
                    await save_chat_history(db_local, uid, message, full_response, 0)
            yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"

       return StreamingResponse(
           generate(),
           media_type="text/event-stream",
           headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
       )
    (Import async_session from app.database. Never touch `db`, `current_user`, or any
     lazy ORM attribute inside generate() — only the captured primitives + a new session.)

GET /history
query params: limit: int = 20, offset: int = 0
Return ChatHistoryResponse(messages=[...], total=<count>) for current_user,
ordered by created_at desc. (Run a count query for total.)

GET /limit
used = await get_counter(cache_key_ai_rate(str(current_user.id)))
Return {"used": used, "max": settings.max_ai_requests_per_day,
"remaining": max(settings.max_ai_requests_per_day - used, 0)}

## Register the router in app/main.py.

PROMPT 9 — Seed Data Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- FastAPI backend, Academic Success Platform. Models: User, Course, GPA, StudyPlan,
  ChatHistory, StudentEmbedding.
- CRITICAL: StudyPlan.status stores LIFECYCLE ONLY (planned/in_progress/completed).
  NEVER seed "available" or "locked" — those are computed at read time from prerequisites.
- Run with: cd academic-backend && python -m scripts.seed
  Create scripts/**init**.py (so `-m scripts.seed` resolves) and scripts/seed.py.
- main() is async, runs via asyncio.run(main()), and opens its OWN async_session
  (from app.database). Hash the password with hash_password (no plaintext).

File: scripts/seed.py — async main() that:

1. Creates 10 Computer Science courses:
   CS101 Introduction to Programming (3 cr, semester 1, prerequisites: [])
   CS102 Data Structures (3 cr, semester 2, prerequisites: ["CS101"])
   CS201 Algorithms (3 cr, semester 3, prerequisites: ["CS102"])
   CS202 Database Systems (3 cr, semester 3, prerequisites: ["CS101"])
   CS301 Software Engineering (3 cr, semester 5, prerequisites: ["CS201","CS202"])
   CS302 Operating Systems (3 cr, semester 5, prerequisites: ["CS201"])
   CS303 Computer Networks (3 cr, semester 6, prerequisites: ["CS302"])
   CS401 Machine Learning (3 cr, semester 7, prerequisites: ["CS201"])
   CS402 Web Development (3 cr, semester 6, prerequisites: ["CS202"])
   CS499 Graduation Project (6 cr, semester 8, prerequisites: ["CS301","CS401"])

2. Creates 1 test student (password hashed via hash_password):
   email: test@academic.com
   password: Test1234!
   name: Ahmed Ali
   major: Computer Science
   university: "Cairo University"
   level: 3
   enrollment_year: 2022
   completed_credit_hours: 12 # MUST equal the 4 graded courses (3+3+3+3) — single source of truth
   total_credit_hours: 33 # sum of ALL 10 study-plan course credits (9×3 + 6)

3. Creates GPA records for Ahmed (4 completed courses — all passing):
   CS101: A (4.75), "Fall 2022", year=2022, semester_number=1
   CS102: B+ (4.25), "Spring 2023", year=2023, semester_number=2
   CS201: A+ (5.00), "Fall 2023", year=2023, semester_number=3
   CS202: A (4.75), "Fall 2023", year=2023, semester_number=3

4. Creates StudyPlan records for Ahmed — LIFECYCLE STATUS ONLY:
   status="completed": CS101, CS102, CS201, CS202 (semester_number set to match grades)
   status="in_progress": CS301, CS302 (semester_number=5, planned_semester="Semester 5") # demos the Planner + workload (3+3 = 6 cr → "Light") and a non-empty Dashboard
   status="planned": CS303, CS401, CS402, CS499 (semester_number = their recommended semester)

   # DO NOT store available/locked. At read time the API will compute, for the planned rows:

   # CS401 -> available (prereq CS201 completed)

   # CS402 -> available (prereq CS202 completed)

   # CS303 -> locked (prereq CS302 is in_progress, not completed)

   # CS499 -> locked (prereqs CS301/CS401 not completed)

5. After committing all rows, build the RAG embeddings so the advisor works out of the box:
   await index_student_data(db, str(ahmed.id))
   (Requires settings.openai_api_key and the pgvector extension. If the key is a placeholder,
   wrap this call in try/except and print a warning instead of failing the whole seed.)

6. Print "✓ Seed complete" when done.

Notes:

- Insert courses first, then the user, then GPA rows, then StudyPlan rows (FK order).
- Use the same async engine/session factory as the app; commit before calling index_student_data.

---

PROMPT 10 — Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context:

- FastAPI backend, Academic Success Platform. pytest + pytest-asyncio (asyncio_mode=auto).
- IMPORTANT: tests MUST run against PostgreSQL + pgvector — NOT SQLite. The schema uses
  Vector(1536), an HNSW index (postgresql_using="hnsw"), JSON, UUID, and DateTime(timezone=True),
  none of which SQLite supports. Use a dedicated test database on the same pgvector container.
- Add a test DB URL to .env / .env.example:
  TEST_DATABASE_URL=postgresql+asyncpg://academic_user:academic_password@localhost:5432/academic_test_db
  (Create the academic_test_db database once: it lives on the pgvector/pgvector:pg16 service.)
- ASGITransport does NOT run the app lifespan, so the fixtures (not init_db/init_redis) are
  responsible for creating the schema and providing Redis.

File: tests/conftest.py

1. Engine + schema (function-scoped, fresh per test for isolation):
   - test_engine = create_async_engine(settings.test_database_url, poolclass=NullPool)
   - @pytest_asyncio.fixture async def test_db():
     async with test_engine.begin() as conn:
     await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
     await conn.run_sync(Base.metadata.create_all)
     TestSession = async_sessionmaker(test_engine, expire_on_commit=False)
     async with TestSession() as session:
     yield session
     async with test_engine.begin() as conn:
     await conn.run_sync(Base.metadata.drop_all)
   - Import Base and ALL models (so metadata is complete) before create_all.

2. Redis: do NOT require a live Redis. Use a fake.
   - Install/instruct fakeredis (add fakeredis to a test requirement) OR monkeypatch the
     app.cache functions. Simplest robust approach: an autouse fixture that patches
     app.cache.redis_client with fakeredis.aioredis.FakeRedis(), so get_cache/set_cache/
     delete_cache/increment/get_counter all work in-memory with real TTL semantics.

3. Dependency override + async client:
   - @pytest_asyncio.fixture async def client(test_db):
     async def \_override_get_db():
     yield test_db
     app.dependency_overrides[get_db] = \_override_get_db
     transport = ASGITransport(app=app)
     async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
     yield ac
     app.dependency_overrides.clear()
     (Every request now uses the test session.)

4. Seed fixture — reuse the Prompt 9 seed logic so tests and seed never drift:
   - @pytest_asyncio.fixture async def seeded_db(test_db):
     Insert the 10 CS courses, the Ahmed Ali user (password hashed),
     the 4 GPA rows (CS101 A, CS102 B+, CS201 A+, CS202 A),
     and StudyPlan rows using LIFECYCLE STATUS ONLY:
     completed: CS101, CS102, CS201, CS202
     in_progress: CS301, CS302 (semester_number=5)
     planned: CS303, CS401, CS402, CS499
     Set user.completed_credit_hours=12, total_credit_hours=33.
     (Do NOT seed available/locked — they are computed at read time.)
     Skip embedding/index calls in tests (no live OpenAI). Return/yield the user.

5. test_user fixture (auth):
   - @pytest_asyncio.fixture async def test_user(seeded_db):
     user = the seeded Ahmed Ali user
     token = create_access_token(str(user.id))
     return (user, token)
   - Helper: auth_headers(token) -> {"Authorization": f"Bearer {token}"}

File: tests/test_auth.py

- test_register_success: POST /api/auth/register (valid body) -> 201; body has access_token + user.
- test_register_duplicate_email: register same email twice -> second is 400.
- test_login_success: POST /api/auth/login -> 200; has access_token.
- test_login_wrong_password: wrong password -> 401.
- test_get_me: GET /api/auth/me with auth_headers(token) -> 200; returns the user's email.
- test_get_me_no_token: GET /api/auth/me with no header -> 401.

File: tests/test_academic.py (use the test_user fixture + auth_headers)

- test_dashboard: GET /api/academic/dashboard -> 200;
  assert "semester_gpa" in body AND "graduation_percentage" in body.
  (NOTE: field is semester_gpa, NOT current_gpa — DashboardResponse was renamed.)
- test_gpa: GET /api/academic/gpa -> 200; assert isinstance(body["cumulative_gpa"], float).
- test_study_plan: GET /api/academic/plan -> 200;
  assert keys completed, in_progress, available, locked all present.
  With the seed: available contains CS401 + CS402; locked contains CS303 + CS499;
  in_progress contains CS301 + CS302; completed contains the 4 graded courses.
- test_available_courses: GET /api/academic/plan/available -> 200; list is NOT empty.
- test_workload: GET /api/academic/plan/workload/5 -> 200;
  assert total_hours == 6 and tier == "Light" (CS301+CS302 = 6 credits in_progress).

File: tests/test_gpa_calculator.py (unit tests for cumulative GPA)
Use a DISTINCT user per case (or flush cache between cases) so the Redis cache does not
leak values across tests.

- test_gpa_calculation_correct:
  user with grades A+(5.0, 3cr) and B+(4.25, 3cr)
  -> calculate_cumulative_gpa == 4.625 ((15 + 12.75) / 6)
- test_gpa_empty_no_error:
  user with no grade rows -> calculate_cumulative_gpa == 0.0 (must guard sum(credits)==0)
- test_gpa_all_f:
  user with only F grades -> calculate_cumulative_gpa == 0.0
  (F rows count toward GPA as 0.0 but never mark a course completed — matches the F policy.)

Run:
pytest tests/ -v
(asyncio_mode=auto configured in pyproject.toml / pytest.ini, so no CLI flag needed.)

---

PROMPT 11 (BONUS) — Fix & Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use this when the build is complete and you want a full review.

You are reviewing a FastAPI backend for an Academic Success Platform (SCHOLAR).
Stack: FastAPI, SQLAlchemy 2.0 ASYNC, PostgreSQL + pgvector, Redis, OpenAI SDK v1 (async).

PART A — General correctness:

- Missing imports or circular imports (especially models <-> models; confirm string-based
  relationship targets and TYPE_CHECKING guards).
- Async functions called without await; any blocking/sync OpenAI client used in async code
  (must be AsyncOpenAI for both embeddings and chat completions).
- SQLAlchemy sessions: opened/closed via dependency, committed where required, no session
  reused after close.
- Missing error handling (bare except, missing HTTPException status codes).
- Pydantic v2: .model_dump() not .dict(); ConfigDict(from_attributes=True) on ORM response
  schemas; no v1 orm_mode.
- Any endpoint missing get_current_user authentication that should have it.
- SSE streaming: generator yields proper "data: {...}\n\n" frames and a final
  {"done": true} frame; media_type="text/event-stream".
- Redis: TTL set correctly for rate limiting (86400s); GPA cache invalidated after grade add.
- CORS: http://localhost:3000 and http://localhost:5173 present in allowed_origins.

PART B — SCHOLAR business-logic invariants (CRITICAL — verify each explicitly):

1. State machine: NO request schema exposes a client-settable `status`. Status changes ONLY
   via add_completed_course_grade (-> completed) and activate_semester_planner (-> in_progress).
2. `available` and `locked` are NEVER persisted to StudyPlan.status — they are computed at
   read time from prerequisites + completed courses (planned rows only).
3. Failing grade ("F"): records the grade for GPA (counts as 0.0) but does NOT set
   status="completed", does NOT add completed_credit_hours, and does NOT satisfy prerequisites.
4. add_completed_course_grade is ATOMIC: one transaction, single commit, rollback on error;
   GPA cache invalidated only after a successful commit.
5. completed_credit_hours reconciles exactly with the sum of passing GPA rows (single source
   of truth = GPA table).
6. Workload tiers come from settings (workload_light_max / workload_optimal_max) — not
   hardcoded; semester_number is the canonical semester key (not planned_semester strings).

PART C — Async + RAG hot spots: 7. SSE generator opens its OWN session (async with async_session() as db_local) for
save_chat_history and references only captured primitives — it must NOT use the
request-scoped db or touch any lazy ORM attribute during streaming (prevents MissingGreenlet). 8. Eager loading: every nested CourseResponse (/plan, /dashboard, /gpa) uses selectinload —
confirm no lazy relationship access in an async path. 9. RAG vector layer: similarity search uses the ORM expression
StudentEmbedding.embedding.cosine_distance(query_vec) (NOT raw SQL string binding);
the HNSW index uses vector_cosine_ops; the column is Vector(settings.embedding_dim);
CREATE EXTENSION vector runs before the table is created. 10. Re-index hook: index_student_data is called (best-effort, post-commit) after
add_completed_course_grade and activate_semester_planner so the advisor reasons over
real-time GPA/plan data. 11. Auth: get_current_user uses verify_access_token (rejects refresh tokens as access);
/refresh uses verify_refresh_token.

For each issue found: show the file, the problem, and the exact fix.
If everything is correct, confirm with "✓ All checks passed".
