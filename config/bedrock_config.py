import boto3
from botocore.config import Config as BotocoreConfig
from config.settings import get_settings

settings = get_settings()

BEDROCK_RUNTIME_CONFIG = BotocoreConfig(
    region_name=settings.aws_region,
    retries={"max_attempts": 3, "mode": "adaptive"},
    read_timeout=120,
    connect_timeout=10,
)

# Model IDs
CLAUDE_MODEL_ID = settings.bedrock_claude_model_id
NOVA_SONIC_MODEL_ID = settings.bedrock_nova_model_id

# Inference parameters for Claude
CLAUDE_INFERENCE_CONFIG = {
    "maxTokens": 4096,
    "temperature": 0.3,
    "topP": 0.9,
}

# Streaming inference config (lower temperature for structured output)
CLAUDE_STRUCTURED_CONFIG = {
    "maxTokens": 8192,
    "temperature": 0.1,
    "topP": 0.95,
}


def get_bedrock_client():
    """Return a Bedrock runtime client."""
    kwargs = {
        "service_name": "bedrock-runtime",
        "region_name": settings.aws_region,
        "config": BEDROCK_RUNTIME_CONFIG,
    }
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    return boto3.client(**kwargs)


