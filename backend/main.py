import os
import re

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session


# --------------------
# Environment variables
# --------------------

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Check your .env file."
    )


# --------------------
# Database connection
# --------------------

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# --------------------
# Database model
# --------------------

class ApplicationDB(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    status = Column(String, nullable=False)
    date = Column(String, nullable=False)
    job_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)


Base.metadata.create_all(bind=engine)


# --------------------
# Request models
# --------------------

class Application(BaseModel):
    company: str
    position: str
    status: str
    date: str
    job_url: str = ""
    notes: str = ""


class ResumeMatchRequest(BaseModel):
    resume_text: str
    job_description: str


# --------------------
# FastAPI application
# --------------------

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------
# Database session
# --------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# --------------------
# Application routes
# --------------------

@app.get("/")
def home():
    return {"message": "ApplyTrack API is running"}


@app.get("/applications")
def get_applications(db: Session = Depends(get_db)):
    return db.query(ApplicationDB).all()


@app.post("/applications")
def create_application(
    application: Application,
    db: Session = Depends(get_db)
):
    new_application = ApplicationDB(
        company=application.company,
        position=application.position,
        status=application.status,
        date=application.date,
        job_url=application.job_url,
        notes=application.notes
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application


@app.put("/applications/{application_id}")
def update_application(
    application_id: int,
    application: Application,
    db: Session = Depends(get_db)
):
    existing_application = (
        db.query(ApplicationDB)
        .filter(ApplicationDB.id == application_id)
        .first()
    )

    if existing_application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    existing_application.company = application.company
    existing_application.position = application.position
    existing_application.status = application.status
    existing_application.date = application.date
    existing_application.job_url = application.job_url
    existing_application.notes = application.notes

    db.commit()
    db.refresh(existing_application)

    return existing_application


@app.delete("/applications/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = (
        db.query(ApplicationDB)
        .filter(ApplicationDB.id == application_id)
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    db.delete(application)
    db.commit()

    return {"message": "Application deleted"}


# --------------------
# Resume Match data
# --------------------

SKILLS = {
    "Python": ["python"],
    "React": ["react", "react.js", "reactjs"],
    "JavaScript": ["javascript", "js"],
    "TypeScript": ["typescript"],
    "Java": ["java"],
    "C++": ["c++"],
    "C#": ["c#"],
    "SQL": ["sql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Git": ["git"],
    "GitHub": ["github"],
    "FastAPI": ["fastapi"],
    "Django": ["django"],
    "Flask": ["flask"],
    "Node.js": ["node.js", "nodejs"],
    "HTML": ["html"],
    "CSS": ["css"],
    "REST APIs": [
        "rest api",
        "restful api",
        "restful services",
        "rest services"
    ],
    "Linux": ["linux"],
    "Agile": ["agile", "scrum"],
    "CI/CD": [
        "ci/cd",
        "continuous integration",
        "continuous deployment"
    ],
    "Machine Learning": [
        "machine learning",
        "ml"
    ],
    "Artificial Intelligence": [
        "artificial intelligence",
        "ai"
    ],
}


ROLE_TERMS = [
    "software engineer",
    "software developer",
    "full stack",
    "full-stack",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "web developer",
    "cloud",
    "developer",
    "engineer",
]


EXPERIENCE_CONCEPTS = {
    "APIs": [
        "api",
        "apis",
        "rest api",
        "backend service"
    ],
    "Databases": [
        "database",
        "databases",
        "relational database"
    ],
    "Testing": [
        "testing",
        "unit testing",
        "test automation"
    ],
    "Cloud": [
        "cloud",
        "aws",
        "azure"
    ],
    "Deployment": [
        "deployment",
        "deploy",
        "production"
    ],
    "Version Control": [
        "git",
        "github",
        "version control"
    ],
    "Agile Development": [
        "agile",
        "scrum",
        "sprint"
    ],
}


STOP_WORDS = {
    "the", "and", "or", "a", "an", "to", "of", "for",
    "in", "on", "with", "is", "are", "be", "as", "at",
    "we", "you", "our", "your", "this", "that", "will",
    "have", "has", "from", "by", "using", "work", "working",
    "experience", "required", "preferred", "looking", "role",
    "team", "candidate", "skills", "skill", "ability"
}


# --------------------
# Resume Match helpers
# --------------------

def normalize_text(text):
    return text.lower().strip()


def phrase_present(text, phrase):
    text = normalize_text(text)
    phrase = normalize_text(phrase)

    if phrase in {"c++", "c#", "ci/cd"}:
        return phrase in text

    pattern = r"(?<!\w)" + re.escape(phrase) + r"(?!\w)"

    return re.search(pattern, text) is not None


def find_skills(text):
    found = []

    for skill, aliases in SKILLS.items():
        if any(
            phrase_present(text, alias)
            for alias in aliases
        ):
            found.append(skill)

    return found


def find_concepts(text):
    found = []

    for concept, phrases in EXPERIENCE_CONCEPTS.items():
        if any(
            phrase_present(text, phrase)
            for phrase in phrases
        ):
            found.append(concept)

    return found


def keyword_score(resume_text, job_text):
    resume_words = set(
        re.findall(
            r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}",
            resume_text.lower()
        )
    )

    job_words = re.findall(
        r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}",
        job_text.lower()
    )

    important_job_words = {
        word
        for word in job_words
        if word not in STOP_WORDS
    }

    if not important_job_words:
        return 0

    matches = important_job_words.intersection(
        resume_words
    )

    score = (
        len(matches) /
        len(important_job_words)
    ) * 100

    return round(min(score, 100))


def role_score(resume_text, job_text):
    job_roles = [
        role
        for role in ROLE_TERMS
        if phrase_present(job_text, role)
    ]

    if not job_roles:
        return 50

    matched_roles = [
        role
        for role in job_roles
        if phrase_present(resume_text, role)
    ]

    if not matched_roles:
        return 25

    return round(
        len(matched_roles) /
        len(job_roles) *
        100
    )


def generate_suggestions(
    missing_skills,
    missing_concepts
):
    suggestions = []

    if missing_skills:
        suggestions.append(
            "Consider highlighting experience with: "
            + ", ".join(missing_skills[:5])
            + "."
        )

    if missing_concepts:
        suggestions.append(
            "The job description emphasizes "
            + ", ".join(missing_concepts[:4])
            + ". Include relevant experience if you have it."
        )

    if not suggestions:
        suggestions.append(
            "Your resume covers most of the major skills "
            "and concepts identified in this job description."
        )

    return suggestions


# --------------------
# Resume Match route
# --------------------

@app.post("/resume-match")
def resume_match(request: ResumeMatchRequest):

    resume_text = normalize_text(
        request.resume_text
    )

    job_text = normalize_text(
        request.job_description
    )

    # Technical skills
    required_skills = find_skills(job_text)
    resume_skills = find_skills(resume_text)

    matched_skills = [
        skill
        for skill in required_skills
        if skill in resume_skills
    ]

    missing_skills = [
        skill
        for skill in required_skills
        if skill not in resume_skills
    ]

    if required_skills:
        technical_score = round(
            len(matched_skills) /
            len(required_skills) *
            100
        )
    else:
        technical_score = 50

    # Keyword overlap
    keywords_score = keyword_score(
        resume_text,
        job_text
    )

    # Role relevance
    roles_score = role_score(
        resume_text,
        job_text
    )

    # Development concepts
    required_concepts = find_concepts(job_text)
    resume_concepts = find_concepts(resume_text)

    matched_concepts = [
        concept
        for concept in required_concepts
        if concept in resume_concepts
    ]

    missing_concepts = [
        concept
        for concept in required_concepts
        if concept not in resume_concepts
    ]

    if required_concepts:
        concepts_score = round(
            len(matched_concepts) /
            len(required_concepts) *
            100
        )
    else:
        concepts_score = 50

    # Weighted overall score
    score = round(
        technical_score * 0.55
        + keywords_score * 0.20
        + concepts_score * 0.15
        + roles_score * 0.10
    )

    score = max(0, min(score, 100))

    suggestions = generate_suggestions(
        missing_skills,
        missing_concepts
    )

    return {
        "score": score,
        "technical_score": technical_score,
        "keyword_score": keywords_score,
        "concept_score": concepts_score,
        "role_score": roles_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "required_skills": required_skills,
        "matched_concepts": matched_concepts,
        "missing_concepts": missing_concepts,
        "suggestions": suggestions
    }