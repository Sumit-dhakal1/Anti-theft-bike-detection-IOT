from machine import Pin, I2C, UART
import time
import math
import network
import urequests

# =========================================
# PIN CONFIGURATION
# =========================================
PIN_SDA = 21
PIN_SCL = 22
PIN_GPS_RX = 25  
PIN_GPS_TX = 26  
PIN_BUZZER = 5

sda = Pin(PIN_SDA)
scl = Pin(PIN_SCL)
buzzer = Pin(PIN_BUZZER, Pin.OUT)
buzzer.off()

# =========================================
# MPU6050 ACCELEROMETER SETUP
# =========================================
MPU_ADDR = 0x68
i2c = I2C(0, scl=scl, sda=sda, freq=400000)
devices = i2c.scan()
print("I2C devices found:", [hex(d) for d in devices])

if MPU_ADDR in devices:
    i2c.writeto_mem(MPU_ADDR, 0x6B, b'\x00')
    print("✓ MPU6050 initialized")
else:
    print("✗ MPU6050 not detected. Check wiring.")

def read_word(reg):
    data = i2c.readfrom_mem(MPU_ADDR, reg, 2)
    value = (data[0] << 8) | data[1]
    if value > 32767:
        value -= 65536
    return value

def get_acceleration():
    ax = read_word(0x3B) / 16384.0
    ay = read_word(0x3D) / 16384.0
    az = read_word(0x3F) / 16384.0
    return ax, ay, az

# =========================================
# GPS SETUP
# =========================================
gps = UART(2, baudrate=9600, rx=PIN_GPS_RX, tx=PIN_GPS_TX, timeout=1000)

def nmea_to_decimal(raw, direction):
    if not raw:
        return None
    try:
        deg = float(raw[:2])
        minutes = float(raw[2:])
        dec = deg + minutes / 60
        if direction in ['S', 'W']:
            dec = -dec
        return round(dec, 6)
    except:
        return None

def read_gps_coordinates():
    if gps.any():
        try:
            line = gps.readline()
            if not line:
                return None
            line = line.decode("utf-8", "ignore").strip()
            parts = line.split(",")
            
            if line.startswith("$GPGGA") or line.startswith("$GNGGA"):
                if len(parts) > 5 and parts[2] and parts[4]:
                    lat = nmea_to_decimal(parts[2], parts[3])
                    lon = nmea_to_decimal(parts[4], parts[5])
                    if lat and lon:
                        return lat, lon
            
            if line.startswith("$GPRMC") or line.startswith("$GNRMC"):
                if len(parts) > 6 and parts[3] and parts[5]:
                    lat = nmea_to_decimal(parts[3], parts[4])
                    lon = nmea_to_decimal(parts[5], parts[6])
                    if lat and lon:
                        return lat, lon
        except Exception as e:
            print("GPS error:", str(e))
    
    return None

# =========================================
# Wi-Fi CONNECTION
# =========================================
def connect_wifi(ssid, password):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if not wlan.isconnected():
        print('🔄 Connecting to Wi-Fi...')
        wlan.connect(ssid, password)
        timeout = 20
        while not wlan.isconnected() and timeout > 0:
            time.sleep(1)
            timeout -= 1
        
        if wlan.isconnected():
            print('✓ Wi-Fi connected')
            print('Network config:', wlan.ifconfig())
        else:
            print('✗ Wi-Fi connection failed')
    else:
        print('✓ Already connected to Wi-Fi')

# Wi-Fi credentials
SSID = 'Budhathoki@vianet'
PASSWORD = 'Yogen$$$1234'
connect_wifi(SSID, PASSWORD)

# =========================================
# GLOBAL VARIABLES
# =========================================
current_mode = "safe"
THRESHOLD = 1.3
SERVER_IP = "192.168.1.76"  # Change to your laptop IP
SERVER_PORT = 3000

# =========================================
# BUZZER TEST
# =========================================
print("\n🔔 Testing buzzer...")
buzzer.on()
time.sleep(0.5)
buzzer.off()
time.sleep(0.3)
buzzer.on()
time.sleep(0.5)
buzzer.off()
print("✓ Buzzer test complete\n")

# =========================================
# SEND DATA TO SERVER
# =========================================
def send_data_to_server(lat, lon, ax, ay, az):
    global current_mode
    url = "http://192.168.1.76:3000/esp32/data"
    
    data = {
        'gps_latitude': lat if lat is not None else 0,
        'gps_longitude': lon if lon is not None else 0,
        'accel_x': ax,
        'accel_y': ay,
        'accel_z': az,
    }
    
    try:
        response = urequests.post(url, json=data)
        
        if response.status_code == 200:
            try:
                result = response.json()
                prev_mode = current_mode
                current_mode = result.get('mode', 'safe')
                threshold = result.get('threshold', 1.3)
                
                if prev_mode != current_mode:
                    print(f"📡 Mode changed: {prev_mode.upper()} → {current_mode.upper()}")
                
            except Exception as json_err:
                print("Error parsing response:", str(json_err))
        else:
            print(f"✗ Server error: {response.status_code}")
        
        response.close()
    except OSError as e:
        if "104" in str(e):  # ECONNRESET is normal
            pass
        else:
            print(f"✗ Network error: {str(e)}")
    except Exception as e:
        print(f"✗ Error sending data: {str(e)}")

# =========================================
# MAIN LOOP
# =========================================
print("=" * 50)
print("🚴 Anti-Theft Bike Detection System")
print("=" * 50)
print(f"Server: {SERVER_IP}:{SERVER_PORT}")
print(f"Initial Mode: {current_mode.upper()}")
print(f"Threshold: {THRESHOLD}g")
print("=" * 50 + "\n")

last_gps_time = 0
gps_send_interval = 5  # Send GPS data every 5 seconds

while True:
    try:
        # Read accelerometer
        ax, ay, az = get_acceleration()
        mag = math.sqrt(ax*ax + ay*ay + az*az)
        
        # Determine alarm state
        alarm = False
        if current_mode == "lock":
            alarm = mag > THRESHOLD
            if alarm:
                buzzer.on()
            else:
                buzzer.off()
        else:
            buzzer.off()
        
        # Display status
        status = "🔔 ALARM" if alarm else "✓ Normal"
        print(f"Mode: {current_mode.upper():4} | X={ax:+.2f} Y={ay:+.2f} Z={az:+.2f} | Mag={mag:.2f}g | {status}")
        
        # Try to get GPS data
        gps_data = read_gps_coordinates()
        if gps_data:
            lat, lon = gps_data
            print(f"📍 GPS: {lat}, {lon}")
            send_data_to_server(lat, lon, ax, ay, az)
            last_gps_time = time.time()
        elif (time.time() - last_gps_time) > gps_send_interval:
            # Send data even without GPS every 5 seconds
            send_data_to_server(None, None, ax, ay, az)
            last_gps_time = time.time()
        
        time.sleep(1)
        
    except Exception as e:
        print(f"✗ Main loop error: {str(e)}")
        time.sleep(1)