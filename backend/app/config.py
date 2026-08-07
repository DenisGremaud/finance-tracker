from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql://finance:finance@localhost:5432/finance_tracker"
    secret_key: str = "change-me-to-a-random-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    reset_token_expire_minutes: int = 30
    cors_origins: str = "http://localhost:5173"

    # Public URL of the frontend, used to build the password reset link.
    frontend_url: str = "http://localhost:5173"

    # Leave smtp_host empty to disable sending: the reset link is written to
    # the logs instead, which keeps the flow usable in local development.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_tls: bool = True
    smtp_from: str = "Finance Tracker <noreply@finance-tracker.app>"

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        # Some platforms (Railway, Heroku) hand out "postgres://", which
        # SQLAlchemy's psycopg2 dialect does not recognize.
        if value.startswith("postgres://"):
            return "postgresql://" + value[len("postgres://") :]
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
