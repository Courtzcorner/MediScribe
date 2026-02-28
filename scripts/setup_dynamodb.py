"""
Script to verify or create the Mediscribe DynamoDB table.
Run this to ensure your table has the correct structure.
"""
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import boto3
from botocore.exceptions import ClientError
from config.settings import get_settings

settings = get_settings()


def setup_table():
    dynamodb_config = {}
    # Only add endpoint_url if it's actually set (not empty string)
    if settings.dynamodb_endpoint_url and settings.dynamodb_endpoint_url.strip():
        dynamodb_config["endpoint_url"] = settings.dynamodb_endpoint_url
    
    dynamodb = boto3.client("dynamodb", region_name=settings.aws_region, **dynamodb_config)
    
    table_name = settings.dynamodb_table_name
    
    # Check if table exists
    try:
        response = dynamodb.describe_table(TableName=table_name)
        print(f"✓ Table '{table_name}' already exists")
        print(f"  Status: {response['Table']['TableStatus']}")
        print(f"  Item count: {response['Table']['ItemCount']}")
        
        # Check key schema
        key_schema = response['Table']['KeySchema']
        print(f"  Key schema: {key_schema}")
        
        return
    except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceNotFoundException':
            raise
        print(f"Table '{table_name}' does not exist. Creating it...")
    
    # Create table with single-table design
    try:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},   # Partition key
                {"AttributeName": "SK", "KeyType": "RANGE"}   # Sort key
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",  # On-demand pricing
            Tags=[
                {"Key": "Application", "Value": "MediScribe"},
                {"Key": "Environment", "Value": settings.environment}
            ]
        )
        print(f"✓ Created table: {table_name}")
        print(f"  Partition Key: PK (String)")
        print(f"  Sort Key: SK (String)")
        print(f"  Billing: PAY_PER_REQUEST")
        print("\nTable is being created. This may take a few moments...")
        
        # Wait for table to be active
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print(f"✓ Table '{table_name}' is now active!")
        
    except ClientError as e:
        print(f"✗ Error creating table: {e}")
        raise
    
    print("\n" + "="*60)
    print("Single-Table Design Pattern:")
    print("="*60)
    print("Sessions:     PK=SESSION#<id>      SK=METADATA")
    print("Doctor Index: PK=DOCTOR#<id>       SK=SESSION#<timestamp>#<id>")
    print("Transcripts:  PK=TRANSCRIPT#<id>   SK=METADATA")
    print("Analysis:     PK=ANALYSIS#<id>     SK=METADATA")
    print("="*60)


if __name__ == "__main__":
    setup_table()
