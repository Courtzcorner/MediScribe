# Migration from PostgreSQL to DynamoDB

## Changes Made

### 1. Dependencies
- **Removed** from `requirements.txt`:
  - `sqlalchemy==2.0.36`
  - `alembic==1.14.0`
  - `psycopg2-binary==2.9.10`
- DynamoDB uses `boto3` which was already in the project

### 2. Configuration Files

#### `config/settings.py`
- Removed PostgreSQL settings (`database_url`, `db_pool_size`, `db_max_overflow`)
- Added DynamoDB settings:
  - `dynamodb_table_sessions`
  - `dynamodb_table_transcripts`
  - `dynamodb_table_analysis`
  - `dynamodb_endpoint_url` (for local development)

#### `.env` and `.env.example`
- Replaced PostgreSQL config with DynamoDB table names
- Added `DYNAMODB_ENDPOINT_URL` for local testing

#### `docker-compose.yml`
- Removed PostgreSQL service and volume
- Updated backend and worker environment variables to use DynamoDB config
- Removed PostgreSQL dependency from backend service

### 3. Database Handler

#### `backend/storage/db_handler.py`
Completely rewritten to use DynamoDB:
- Uses `boto3` DynamoDB resource
- Converts between Python types and DynamoDB types (Decimal handling)
- Implements same interface as before:
  - `save_session()`, `get_session()`, `list_sessions()`
  - `save_transcript()`
  - `save_analysis()`

### 4. Setup Script

#### `scripts/setup_dynamodb.py`
New script to create DynamoDB tables:
- Creates three tables: sessions, transcripts, analysis
- Uses PAY_PER_REQUEST billing mode (no capacity planning needed)
- Adds GSI on `doctor_id` for efficient session queries

### 5. Makefile
- Removed: `migrate`, `migrate-create`, `migrate-rollback`
- Added: `setup-dynamodb` to create tables
- Updated: `setup` target to use `setup-dynamodb` instead of `migrate`

## Next Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Update Environment Variables
Copy the new DynamoDB config from `.env.example` to your `.env` file:
```bash
DYNAMODB_TABLE_SESSIONS=mediscribe-sessions
DYNAMODB_TABLE_TRANSCRIPTS=mediscribe-transcripts
DYNAMODB_TABLE_ANALYSIS=mediscribe-analysis
DYNAMODB_ENDPOINT_URL=
```

### 3. Create DynamoDB Tables
Run the setup script to create tables in AWS:
```bash
python scripts/setup_dynamodb.py
```

Or use the Makefile:
```bash
make setup-dynamodb
```

### 4. Restart Backend
Stop any running backend processes and restart:
```bash
make dev-backend
```

## DynamoDB Table Structure

### Sessions Table
- **Partition Key**: `id` (String)
- **GSI**: `doctor_id-index` on `doctor_id`
- **Attributes**: title, doctor_id, patient_id, status, duration, audio_url, transcript_id, analysis_id, notes, created_at, updated_at

### Transcripts Table
- **Partition Key**: `id` (String)
- **Attributes**: session_id, raw_text, segments, language, word_count, created_at, updated_at

### Analysis Table
- **Partition Key**: `id` (String)
- **Attributes**: session_id, transcript_id, summary, soap_note, medications, diagnoses, follow_up, key_points, patient_instructions, model_used, created_at

## Benefits of DynamoDB

1. **No server management** - fully managed service
2. **Automatic scaling** - handles traffic spikes
3. **Pay per request** - no idle database costs
4. **AWS integration** - works seamlessly with Bedrock, S3, etc.
5. **High availability** - built-in replication

## Local Development (Optional)

To use local DynamoDB for development:

1. Install DynamoDB Local:
```bash
docker run -p 8001:8000 amazon/dynamodb-local
```

2. Set endpoint in `.env`:
```bash
DYNAMODB_ENDPOINT_URL=http://localhost:8001
```

3. Create tables:
```bash
python scripts/setup_dynamodb.py
```
