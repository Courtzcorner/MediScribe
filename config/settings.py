from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    # App
    environment: str = "development"
    log_level: str = "INFO"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    # AWS (use AWS_SESSION_TOKEN for temporary credentials, e.g. from AWS SSO/Console)
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_session_token: str = ""

    # Bedrock
    bedrock_claude_model_id: str = "us.anthropic.claude-sonnet-4-6-20250514-v1:0"
    bedrock_nova_model_id: str = "amazon.nova-sonic-v1:0"
    transcribe_language_code: str = "en-US"

    # Database (DynamoDB)
    dynamodb_table_name: str = "Mediscribe"
    dynamodb_endpoint_url: str = ""  # Empty for AWS, set for local DynamoDB

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # S3
    s3_bucket_name: str = "mediscribe-audio-recordings"
    s3_region: str = "us-east-1"
    s3_presigned_url_expiry: int = 3600

    # Auth
    jwt_secret_key: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
