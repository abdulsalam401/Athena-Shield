from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Athena Shield"
    API_V1_STR: str = "/api/v1"
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_MOCK_REDIS: bool = False

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
