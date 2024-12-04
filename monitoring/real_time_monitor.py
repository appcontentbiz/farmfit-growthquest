import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
import numpy as np
from dataclasses import dataclass
from collections import deque
import json
import websockets
import ssl
import hashlib
import hmac
from cryptography.fernet import Fernet
from concurrent.futures import ThreadPoolExecutor

# Configure logging with detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class SensorReading:
    """Secure, validated sensor reading with integrity check"""
    timestamp: datetime
    value: float
    unit: str
    sensor_id: str
    checksum: str
    confidence: float
    calibration_date: datetime
    is_validated: bool = False

    def validate(self, secret_key: str) -> bool:
        """Validate reading integrity"""
        data = f"{self.timestamp}{self.value}{self.unit}{self.sensor_id}"
        expected_hash = hmac.new(
            secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        self.is_validated = hmac.compare_digest(expected_hash, self.checksum)
        return self.is_validated

class RealTimeBuffer:
    """Thread-safe buffer for real-time data with automatic cleanup"""
    def __init__(self, max_size: int = 1000, cleanup_interval: int = 3600):
        self.buffer = deque(maxlen=max_size)
        self.lock = asyncio.Lock()
        self.cleanup_interval = cleanup_interval
        self.last_cleanup = datetime.now()

    async def add(self, reading: SensorReading):
        async with self.lock:
            self.buffer.append(reading)
            await self._cleanup_if_needed()

    async def get_recent(self, seconds: int) -> List[SensorReading]:
        cutoff = datetime.now() - timedelta(seconds=seconds)
        async with self.lock:
            return [r for r in self.buffer if r.timestamp > cutoff]

    async def _cleanup_if_needed(self):
        if (datetime.now() - self.last_cleanup).seconds > self.cleanup_interval:
            self.last_cleanup = datetime.now()
            cutoff = datetime.now() - timedelta(days=7)
            self.buffer = deque(
                (r for r in self.buffer if r.timestamp > cutoff),
                maxlen=self.buffer.maxlen
            )

class RealTimeMonitor:
    """Advanced real-time monitoring system with security and validation"""
    def __init__(self, encryption_key: str, secret_key: str):
        self.encryption = Fernet(encryption_key.encode())
        self.secret_key = secret_key
        self.buffers: Dict[str, RealTimeBuffer] = {}
        self.alert_callbacks = []
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.is_running = False
        self.websocket = None

    async def start(self, websocket_url: str):
        """Start real-time monitoring with secure websocket connection"""
        self.is_running = True
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = True
        ssl_context.verify_mode = ssl.CERT_REQUIRED

        try:
            async with websockets.connect(
                websocket_url, 
                ssl=ssl_context
            ) as websocket:
                self.websocket = websocket
                await self._monitor_loop()
        except Exception as e:
            logger.error(f"Monitoring error: {str(e)}")
            raise

    async def stop(self):
        """Gracefully stop monitoring"""
        self.is_running = False
        if self.websocket:
            await self.websocket.close()
        self.executor.shutdown(wait=True)

    async def _monitor_loop(self):
        """Main monitoring loop with error handling and recovery"""
        while self.is_running:
            try:
                message = await self.websocket.recv()
                decrypted_data = self.encryption.decrypt(message.encode())
                reading = self._parse_reading(json.loads(decrypted_data))
                
                if not reading.validate(self.secret_key):
                    logger.warning(f"Invalid reading from sensor {reading.sensor_id}")
                    continue

                await self._process_reading(reading)
                await self._check_alerts(reading)

            except websockets.exceptions.ConnectionClosed:
                logger.error("Connection lost. Attempting to reconnect...")
                await asyncio.sleep(5)
                continue
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                await asyncio.sleep(1)

    def _parse_reading(self, data: Dict) -> SensorReading:
        """Parse and validate incoming sensor data"""
        try:
            return SensorReading(
                timestamp=datetime.fromisoformat(data['timestamp']),
                value=float(data['value']),
                unit=str(data['unit']),
                sensor_id=str(data['sensor_id']),
                checksum=str(data['checksum']),
                confidence=float(data['confidence']),
                calibration_date=datetime.fromisoformat(data['calibration_date'])
            )
        except (ValueError, KeyError) as e:
            logger.error(f"Error parsing sensor reading: {str(e)}")
            raise

    async def _process_reading(self, reading: SensorReading):
        """Process and store validated readings"""
        if reading.sensor_id not in self.buffers:
            self.buffers[reading.sensor_id] = RealTimeBuffer()
        
        await self.buffers[reading.sensor_id].add(reading)

    async def _check_alerts(self, reading: SensorReading):
        """Check for alert conditions in parallel"""
        def check_alert(callback):
            try:
                return callback(reading)
            except Exception as e:
                logger.error(f"Error in alert callback: {str(e)}")
                return None

        alert_futures = [
            self.executor.submit(check_alert, callback)
            for callback in self.alert_callbacks
        ]
        
        for future in alert_futures:
            result = await asyncio.wrap_future(future)
            if result:
                await self._handle_alert(result)

    async def _handle_alert(self, alert_data: Dict):
        """Handle and distribute alerts"""
        try:
            # Process alert based on severity
            if alert_data['severity'] == 'critical':
                await self._send_immediate_alert(alert_data)
            else:
                await self._queue_alert(alert_data)
        except Exception as e:
            logger.error(f"Error handling alert: {str(e)}")

    async def get_statistics(
        self,
        sensor_id: str,
        timeframe: int
    ) -> Dict[str, float]:
        """Calculate real-time statistics for a sensor"""
        readings = await self.buffers[sensor_id].get_recent(timeframe)
        if not readings:
            return {}

        values = [r.value for r in readings]
        return {
            'mean': float(np.mean(values)),
            'std': float(np.std(values)),
            'min': float(np.min(values)),
            'max': float(np.max(values)),
            'median': float(np.median(values)),
            'count': len(values),
            'confidence': float(np.mean([r.confidence for r in readings]))
        }

    async def get_trend_analysis(
        self,
        sensor_id: str,
        timeframe: int
    ) -> Dict[str, Union[float, str]]:
        """Analyze trends in sensor data"""
        readings = await self.buffers[sensor_id].get_recent(timeframe)
        if len(readings) < 2:
            return {}

        values = np.array([r.value for r in readings])
        times = np.array([(r.timestamp - readings[0].timestamp).total_seconds()
                         for r in readings])

        # Calculate trend
        z = np.polyfit(times, values, 1)
        slope = z[0]

        # Determine trend direction and strength
        trend_strength = abs(slope) * timeframe / np.mean(values)
        if trend_strength < 0.1:
            trend = "stable"
        else:
            trend = "increasing" if slope > 0 else "decreasing"

        return {
            'trend': trend,
            'trend_strength': float(trend_strength),
            'slope': float(slope),
            'r_squared': float(np.corrcoef(times, values)[0, 1]**2)
        }

    def add_alert_callback(self, callback):
        """Add a new alert callback"""
        self.alert_callbacks.append(callback)

    async def _send_immediate_alert(self, alert_data: Dict):
        """Send immediate alert for critical conditions"""
        # Implementation would depend on your alert system
        logger.critical(f"CRITICAL ALERT: {alert_data}")

    async def _queue_alert(self, alert_data: Dict):
        """Queue non-critical alert for batch processing"""
        # Implementation would depend on your alert system
        logger.warning(f"Alert queued: {alert_data}")

    async def get_health_check(self) -> Dict[str, str]:
        """Check system health status"""
        return {
            'status': 'healthy' if self.is_running else 'stopped',
            'last_cleanup': self.last_cleanup.isoformat(),
            'buffer_sizes': {
                sensor_id: len(buffer.buffer)
                for sensor_id, buffer in self.buffers.items()
            },
            'uptime': str(datetime.now() - self.start_time)
        }
