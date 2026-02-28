"""
S3 operations: upload audio, store transcripts/analyses, generate presigned URLs.
"""
from __future__ import annotations

import json
from datetime import datetime

import boto3
from botocore.exceptions import ClientError

from backend.utils.logger import get_logger
from backend.utils.error_handler import StorageError
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class S3Handler:
    def __init__(self) -> None:
        kwargs: dict = {"region_name": settings.s3_region}
        if settings.aws_access_key_id:
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        self._client = boto3.client("s3", **kwargs)
        self._bucket = settings.s3_bucket_name
        self._ensure_bucket_available()

    def _ensure_bucket_available(self) -> None:
        try:
            self._client.head_bucket(Bucket=self._bucket)
            return
        except ClientError as e:
            response = e.response if isinstance(e.response, dict) else {}
            code = str(response.get("Error", {}).get("Code", ""))
            missing_bucket_codes = {"404", "NoSuchBucket", "NotFound"}
            if code in missing_bucket_codes and settings.is_development:
                self._create_bucket()
                return
            raise StorageError(
                f"S3 bucket '{self._bucket}' is not accessible. "
                f"Set S3_BUCKET_NAME to an existing bucket or create it in region {settings.s3_region}."
            ) from e

    def _create_bucket(self) -> None:
        try:
            kwargs = {"Bucket": self._bucket}
            if settings.s3_region != "us-east-1":
                kwargs["CreateBucketConfiguration"] = {
                    "LocationConstraint": settings.s3_region
                }
            self._client.create_bucket(**kwargs)
            logger.warning(
                "s3_bucket_auto_created",
                bucket=self._bucket,
                region=settings.s3_region,
            )
        except ClientError as e:
            raise StorageError(
                f"S3 bucket '{self._bucket}' does not exist and could not be created automatically. "
                f"Create it manually in {settings.s3_region} and retry."
            ) from e

    def upload_audio(self, audio_bytes: bytes, key: str) -> str:
        """Upload raw audio bytes. Returns the S3 URI."""
        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=audio_bytes,
                ContentType="audio/wav",
                ServerSideEncryption="AES256",
                Metadata={"uploaded-at": datetime.utcnow().isoformat()},
            )
            uri = f"s3://{self._bucket}/{key}"
            logger.info("s3_upload_success", key=key, size=len(audio_bytes))
            return uri
        except ClientError as e:
            raise StorageError(f"Failed to upload audio to S3: {e}") from e

    def upload_json(self, data: dict, key: str) -> str:
        """Store a JSON document in S3. Returns the S3 URI."""
        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=json.dumps(data, default=str).encode(),
                ContentType="application/json",
                ServerSideEncryption="AES256",
            )
            return f"s3://{self._bucket}/{key}"
        except ClientError as e:
            raise StorageError(f"Failed to upload JSON to S3: {e}") from e

    def get_presigned_url(self, key: str, expiry: int | None = None) -> str:
        """Generate a presigned GET URL for the given key."""
        try:
            return self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expiry or settings.s3_presigned_url_expiry,
            )
        except ClientError as e:
            raise StorageError(f"Failed to generate presigned URL: {e}") from e

    def delete_object(self, key: str) -> None:
        """Delete an object from S3."""
        try:
            self._client.delete_object(Bucket=self._bucket, Key=key)
            logger.info("s3_delete", key=key)
        except ClientError as e:
            raise StorageError(f"Failed to delete S3 object: {e}") from e

    def object_exists(self, key: str) -> bool:
        """Check if a key exists in the bucket."""
        try:
            self._client.head_object(Bucket=self._bucket, Key=key)
            return True
        except ClientError:
            return False
