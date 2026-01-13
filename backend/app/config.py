import os


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/docproc"
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/tmp/docproc_uploads")


settings = Settings()
