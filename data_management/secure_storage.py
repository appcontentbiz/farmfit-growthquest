import sqlite3
from typing import Dict, List, Optional, Union, Any
import json
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from pathlib import Path
import asyncio
import aiosqlite
from cryptography.fernet import Fernet
from dataclasses import dataclass
import numpy as np
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

@dataclass
class DataPoint:
    timestamp: datetime
    sensor_id: str
    value: float
    unit: str
    metadata: Dict[str, Any]
    checksum: str

class SecureStorage:
    def __init__(
        self,
        db_path: str,
        encryption_key: str,
        secret_key: str,
        max_connections: int = 5
    ):
        self.db_path = Path(db_path)
        self.encryption = Fernet(encryption_key.encode())
        self.secret_key = secret_key
        self.pool = ThreadPoolExecutor(max_workers=max_connections)
        self._initialize_database()

    def _initialize_database(self):
        """Initialize database with secure schema"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS sensor_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        sensor_id TEXT NOT NULL,
                        encrypted_value BLOB NOT NULL,
                        unit TEXT NOT NULL,
                        encrypted_metadata BLOB NOT NULL,
                        checksum TEXT NOT NULL,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                conn.execute("""
                    CREATE TABLE IF NOT EXISTS data_integrity (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        data_hash TEXT NOT NULL,
                        record_count INTEGER NOT NULL,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # Create indexes for better query performance
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp 
                    ON sensor_data(timestamp)
                """)
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_id 
                    ON sensor_data(sensor_id)
                """)

        except Exception as e:
            logger.error(f"Database initialization error: {str(e)}")
            raise

    async def store_data_point(self, data_point: DataPoint) -> bool:
        """Store a single data point securely"""
        try:
            # Validate data integrity
            if not self._verify_checksum(data_point):
                logger.warning(f"Invalid checksum for sensor {data_point.sensor_id}")
                return False

            # Encrypt sensitive data
            encrypted_value = self.encryption.encrypt(
                str(data_point.value).encode()
            )
            encrypted_metadata = self.encryption.encrypt(
                json.dumps(data_point.metadata).encode()
            )

            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT INTO sensor_data (
                        timestamp, sensor_id, encrypted_value, unit,
                        encrypted_metadata, checksum
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    data_point.timestamp.isoformat(),
                    data_point.sensor_id,
                    encrypted_value,
                    data_point.unit,
                    encrypted_metadata,
                    data_point.checksum
                ))
                await db.commit()

            return True

        except Exception as e:
            logger.error(f"Error storing data point: {str(e)}")
            return False

    async def get_data_points(
        self,
        sensor_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[DataPoint]:
        """Retrieve and decrypt data points"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                async with db.execute("""
                    SELECT timestamp, sensor_id, encrypted_value, unit,
                           encrypted_metadata, checksum
                    FROM sensor_data
                    WHERE sensor_id = ? AND timestamp BETWEEN ? AND ?
                    ORDER BY timestamp ASC
                """, (sensor_id, start_time.isoformat(), end_time.isoformat())) as cursor:
                    rows = await cursor.fetchall()

            return [
                self._decrypt_data_point(row)
                for row in rows
            ]

        except Exception as e:
            logger.error(f"Error retrieving data points: {str(e)}")
            return []

    def _decrypt_data_point(self, row: tuple) -> DataPoint:
        """Decrypt a single data point"""
        try:
            decrypted_value = float(
                self.encryption.decrypt(row[2]).decode()
            )
            decrypted_metadata = json.loads(
                self.encryption.decrypt(row[4]).decode()
            )

            return DataPoint(
                timestamp=datetime.fromisoformat(row[0]),
                sensor_id=row[1],
                value=decrypted_value,
                unit=row[3],
                metadata=decrypted_metadata,
                checksum=row[5]
            )

        except Exception as e:
            logger.error(f"Error decrypting data point: {str(e)}")
            raise

    def _verify_checksum(self, data_point: DataPoint) -> bool:
        """Verify data integrity using HMAC"""
        data = f"{data_point.timestamp}{data_point.sensor_id}{data_point.value}{data_point.unit}"
        expected_hash = hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_hash, data_point.checksum)

    async def get_statistics(
        self,
        sensor_id: str,
        timeframe: timedelta
    ) -> Dict[str, float]:
        """Calculate statistics for a sensor's data"""
        end_time = datetime.now()
        start_time = end_time - timeframe

        try:
            data_points = await self.get_data_points(
                sensor_id, start_time, end_time
            )
            
            if not data_points:
                return {}

            values = [dp.value for dp in data_points]
            return {
                'mean': float(np.mean(values)),
                'std': float(np.std(values)),
                'min': float(np.min(values)),
                'max': float(np.max(values)),
                'median': float(np.median(values)),
                'count': len(values)
            }

        except Exception as e:
            logger.error(f"Error calculating statistics: {str(e)}")
            return {}

    async def get_aggregated_data(
        self,
        sensor_id: str,
        start_time: datetime,
        end_time: datetime,
        interval: str
    ) -> List[Dict[str, Any]]:
        """Get aggregated data for visualization"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                async with db.execute(f"""
                    SELECT 
                        strftime(?, timestamp) as period,
                        COUNT(*) as count,
                        GROUP_CONCAT(encrypted_value) as values
                    FROM sensor_data
                    WHERE sensor_id = ? AND timestamp BETWEEN ? AND ?
                    GROUP BY period
                    ORDER BY period ASC
                """, (interval, sensor_id, start_time.isoformat(), end_time.isoformat())) as cursor:
                    rows = await cursor.fetchall()

            result = []
            for row in rows:
                period, count, encrypted_values = row
                values = [
                    float(self.encryption.decrypt(val.encode()).decode())
                    for val in encrypted_values.split(',')
                ]
                
                result.append({
                    'period': period,
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'min': float(np.min(values)),
                    'max': float(np.max(values)),
                    'count': count
                })

            return result

        except Exception as e:
            logger.error(f"Error aggregating data: {str(e)}")
            return []

    async def backup_data(self, backup_path: Path):
        """Create encrypted backup of data"""
        try:
            async with aiosqlite.connect(self.db_path) as source_db:
                # Create backup database
                async with aiosqlite.connect(backup_path) as backup_db:
                    await source_db.backup(backup_db)

            logger.info(f"Backup created at {backup_path}")
            return True

        except Exception as e:
            logger.error(f"Backup error: {str(e)}")
            return False

    async def verify_data_integrity(self) -> bool:
        """Verify integrity of all stored data"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                async with db.execute("""
                    SELECT timestamp, sensor_id, encrypted_value, unit,
                           checksum
                    FROM sensor_data
                    ORDER BY timestamp ASC
                """) as cursor:
                    rows = await cursor.fetchall()

            for row in rows:
                data = f"{row[0]}{row[1]}{self.encryption.decrypt(row[2]).decode()}{row[3]}"
                expected_hash = hmac.new(
                    self.secret_key.encode(),
                    data.encode(),
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(expected_hash, row[4]):
                    logger.error(f"Data integrity violation found at {row[0]}")
                    return False

            return True

        except Exception as e:
            logger.error(f"Error verifying data integrity: {str(e)}")
            return False

    async def cleanup_old_data(self, retention_days: int):
        """Safely remove old data"""
        try:
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    DELETE FROM sensor_data
                    WHERE timestamp < ?
                """, (cutoff_date.isoformat(),))
                await db.commit()

            logger.info(f"Cleaned up data older than {cutoff_date}")
            return True

        except Exception as e:
            logger.error(f"Error cleaning up old data: {str(e)}")
            return False
