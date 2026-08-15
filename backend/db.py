from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# DATABASE_URL = "sqlite:///./app.db"
DATABASE_URL="postgresql://postgres.zuaueheflpxczyzousrs:Ankur2658778@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"

engine = create_engine(
    DATABASE_URL
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db: Session = SessionLocal()

    try:
        yield db
    finally:
        db.close()