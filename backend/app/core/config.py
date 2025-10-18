from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Application
    PROJECT_NAME: str = "Boletería API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @property
    def allowed_origins_list(self) -> list[str]:
        """Convert comma-separated origins string to list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
