<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
##
Đăng ký/Đăng nhập: quản lý tài khoản, xác thực JWT, phân quyền (user/admin).​

Đăng ký & ghi danh: người học đăng ký, xem khóa học​

Flashcards & ôn tập: tạo bộ flashcard, chế độ ôn tập, theo dõi tiến độ nhớ.​

Bài kiểm tra / Test: tạo/thi/điểm bài kiểm tra, lưu kết quả, báo cáo hiệu suất.​

Chat thời gian thực: chat giữa học viên/giảng viên, thông báo thời gian thực via Socket.IO.​

​/*
 * ESP32 Smart Home Device
 * Tích hợp với hệ thống IoT qua MQTT
 * 
 * Chức năng:
 * - Kết nối WiFi (tự động hoặc setup mode)
 * - Kết nối MQTT với TLS/SSL
 * - Đăng ký thiết bị qua MQTT
 * - Gửi dữ liệu sensor/actuator định kỳ
 * - Nhận và xử lý lệnh từ server
 * - Last Will and Testament (LWT)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ==================== CẤU HÌNH MQTT ====================
#define MQTT_BROKER "707d6798baa54e22a0d6a43694d39e47.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USERNAME "ngohai"
#define MQTT_PASSWORD "NgoHai0804"
#define MQTT_MAX_PACKET_SIZE 2048

// ==================== CẤU HÌNH THIẾT BỊ ====================
String DEVICE_ID_NUM; // Device tự tạo ID duy nhất
String DEVICE_NAME = "ESP32 Smart Home";
String DEVICE_TYPE = "esp32";

// ==================== CẤU HÌNH SENSORS ====================
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define PIR_PIN 27
#define IR_PIN 33

// Sensor IDs
String SENSOR_TEMP_ID ;
String SENSOR_HUMIDITY_ID ;
String SENSOR_PIR_ID ;

// ==================== CẤU HÌNH ACTUATORS ====================
#define LED_PIR_PIN 26
#define LED_IR_PIN 32

// Actuator IDs
String ACTUATOR_RELAY_ID ;
String ACTUATOR_LED_IR_ID ;
String ACTUATOR_OLED_ID ;

// ==================== CẤU HÌNH OLED ====================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool oledEnabled = true;

// ==================== CẤU HÌNH THỜI GIAN ====================
const unsigned long DHT_INTERVAL = 2000;      // Đọc DHT mỗi 2 giây
const unsigned long MQTT_DATA_INTERVAL = 5000; // Gửi dữ liệu MQTT mỗi 5 giây
const unsigned long OLED_INTERVAL = 1000;      // Cập nhật OLED mỗi 1 giây
const unsigned long WIFI_CONNECT_TIMEOUT = 30000;
const unsigned long WIFI_LOST_TIMEOUT = 30000;

unsigned long lastDHT = 0;
unsigned long lastMQTT = 0;
unsigned long lastOLED = 0;

// ==================== BIẾN TRẠNG THÁI ====================
float temperature = NAN;
float humidity = NAN;
bool pirState = false;
bool irState = false;

bool deviceEnabled = true;
bool sensorStates[3] = {true, true , true}; // temp, humidity, pir
bool actuatorStates[3] = {false, false , true};         // relay, led_ir , oled

bool mqttConnected = false;
bool deviceRegistered = false;
bool mqttRegisterSent = false;
int helloX = 0;
int helloStep = 2;
bool helloMoveRight = true;

// ==================== WIFI SETUP MODE ====================
const char *AP_SSID = "ESP32_AP";
const char *AP_PASSWORD = "12345678";
bool isSetupMode = false;
bool wasConnected = false;
unsigned long wifiLostTime = 0;

WebServer server(80);
Preferences prefs;

// Form HTML cho WiFi setup
const char *htmlForm = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ESP32 WiFi Setup</title>
  <style>
    body { font-family: Arial; margin: 40px; }
    input { padding:8px; margin:6px 0; width: 100%; box-sizing: border-box; }
    button { padding:10px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    .container { max-width:400px; margin:auto; }
  </style>
</head>
<body>
  <div class="container">
    <h2>WiFi Setup</h2>
    <form action="/connect" method="post">
      <label>SSID:</label>
      <input type="text" name="ssid" required>
      <label>Password:</label>
      <input type="password" name="password">
      <button type="submit">Connect</button>
    </form>
  </div>
</body>
</html>
)rawliteral";
//sinh id ngẫu nhiên
String makeId(const String &prefix)
{
  int rnd = random(0, 100); // 00 - 99
  char buf[5];
  sprintf(buf, "%02d", rnd);
  return prefix + String(buf);
}

// ==================== MQTT CLIENT ====================
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// ==================== HÀM WIFI ====================

/**
 * Xử lý request root (hiển thị form)
 */
void handleRoot() {
  server.send(200, "text/html", htmlForm);
}

/**
 * Xử lý request connect WiFi
 */
void handleConnect() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  String ssid = server.arg("ssid");
  String password = server.arg("password");

  server.send(200, "text/html", "<html><body><h3>Connecting to " + ssid + "...</h3></body></html>");

  // Lưu credentials
  prefs.begin("wifi", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", password);
  prefs.end();

  // Kết nối WiFi
  connectWiFi(ssid, password);
}

/**
 * Xử lý 404
 */
void handleNotFound() {
  server.send(404, "text/plain", "404: Not found");
}

/**
 * Kết nối WiFi với SSID và password
 */
void connectWiFi(String ssid, String password) {
  WiFi.disconnect(true);
  delay(500);

  WiFi.mode(WIFI_AP_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid.c_str(), password.c_str());

  unsigned long start = millis();
  while (millis() - start < WIFI_CONNECT_TIMEOUT) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi connected!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      WiFi.softAPdisconnect(true);
      isSetupMode = false;
      server.stop();
      return;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connection failed!");
  startSetupMode();
}

/**
 * Thử kết nối WiFi từ credentials đã lưu
 */
void tryAutoConnectWiFi() {
  prefs.begin("wifi", true);
  String ssid = prefs.getString("ssid", "");
  String pass = prefs.getString("pass", "");
  prefs.end();

  if (ssid.length() > 0) {
    Serial.print("Auto-connecting to: ");
    Serial.println(ssid);
    connectWiFi(ssid, pass);
  } else {
    Serial.println("No saved WiFi credentials - Entering setup mode");
    startSetupMode();
  }
}

/**
 * Bắt đầu setup mode (AP mode)
 */
void startSetupMode() {
  isSetupMode = true;
  Serial.println("Starting setup mode...");
  WiFi.disconnect(true);
  delay(1000);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP: ");
  Serial.println(IP);

  server.on("/", HTTP_GET, handleRoot);
  server.on("/connect", HTTP_POST, handleConnect);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("WebServer started at http://192.168.4.1/");
}

/**
 * Kiểm tra và xử lý trạng thái WiFi
 */
void checkWiFiStatus() {
  bool wifiConnected = (WiFi.status() == WL_CONNECTED);

  if (wifiConnected) {
    wasConnected = true;
    wifiLostTime = 0;
  } else {
    if (wasConnected) {
      if (wifiLostTime == 0) {
        wifiLostTime = millis();
        Serial.println("WiFi lost - Waiting 30s before setup mode...");
      } else if (millis() - wifiLostTime >= WIFI_LOST_TIMEOUT) {
        Serial.println("WiFi lost too long - Entering setup mode");
        startSetupMode();
      }
    }
  }
}

// ==================== HÀM MQTT ====================

/**
 * Callback khi kết nối MQTT thành công
 */
void onMQTTConnect() {
  Serial.println("MQTT connected!");
  mqttConnected = true;

  // Subscribe topic command
  String commandTopic = "device/" + DEVICE_ID_NUM + "/command";
  mqttClient.subscribe(commandTopic.c_str(), 1);
  Serial.println("Subscribed to: " + commandTopic);

  // Subscribe topic register response
  String responseTopic = "device/" + DEVICE_ID_NUM + "/register/response";
  mqttClient.subscribe(responseTopic.c_str(), 1);
  Serial.println("Subscribed to: " + responseTopic);
}

/**
 * Kết nối MQTT
 */
void connectMQTT() {
  if (mqttClient.connected()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.print("Connecting to MQTT broker...");

  String clientId = "ESP32-" + DEVICE_ID_NUM + "-" + String(random(0xffff), HEX);

  String lwtTopic = "device/" + DEVICE_ID_NUM + "/lwt";
  String lwtPayload = "{\"status\":\"offline\"}";

  bool connected = mqttClient.connect(
    clientId.c_str(),
    MQTT_USERNAME,
    MQTT_PASSWORD,
    lwtTopic.c_str(),   // will topic
    1,                  // QoS
    false,              // retain
    lwtPayload.c_str()  // will message
  );

  if (connected) {
    Serial.println("MQTT connected!");
    mqttConnected = true;
    onMQTTConnect();

    if (!mqttRegisterSent) {
      delay(500);
      registerDevice();
      mqttRegisterSent = true;
    }
  } else {
    Serial.print(" failed, state=");
    Serial.println(mqttClient.state());
    mqttConnected = false;
  }
}


/**
 * Callback khi nhận message từ MQTT
 */
void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Received MQTT message: ");
  Serial.print(topic);
  Serial.print(" - ");
  Serial.println(message);

  String topicStr = String(topic);

  // Xử lý register response
  if (topicStr.indexOf("/register/response") >= 0) {
    handleRegisterResponse(message);
    return;
  }

  // Xử lý command
  if (topicStr.indexOf("/command") >= 0) {
    handleCommand(message);
    return;
  }
}

/**
 * Xử lý response đăng ký thiết bị
 */
void handleRegisterResponse(String payload) {
  DynamicJsonDocument doc(512);
  deserializeJson(doc, payload);

  if (doc["status"] == "success") {
    deviceRegistered = true;
    Serial.println("Device registered successfully!");
    Serial.print("Device ID: ");
    Serial.println(doc["device_id"].as<String>());
  } else {
    Serial.println("Device registration failed!");
    deviceRegistered = false;
  }
}

/**
 * Xử lý lệnh từ server
 */
void handleCommand(String payload) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);

  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  /* ===== DEVICE ENABLE ===== */
  if (doc.containsKey("device_enabled")) {
    deviceEnabled = doc["device_enabled"].as<bool>();
    Serial.print("Device enabled: ");
    Serial.println(deviceEnabled ? "ON" : "OFF");

    if (!deviceEnabled) {
      turnOffAllSensors();
      turnOffAllActuators();
    }
  }

  /* ===== SENSORS ===== */
  if (doc.containsKey("sensors") && deviceEnabled) {
    JsonObject sensors = doc["sensors"];

    if (sensors.containsKey(SENSOR_TEMP_ID))
      sensorStates[0] = sensors[SENSOR_TEMP_ID].as<bool>();

    if (sensors.containsKey(SENSOR_HUMIDITY_ID))
      sensorStates[1] = sensors[SENSOR_HUMIDITY_ID].as<bool>();

    if (sensors.containsKey(SENSOR_PIR_ID))
      sensorStates[2] = sensors[SENSOR_PIR_ID].as<bool>();

    Serial.println("Sensor states updated");
  }

  /* ===== ACTUATORS ===== */
  if (doc.containsKey("actuators") && deviceEnabled) {
    JsonObject actuators = doc["actuators"];

    // Relay
    if (actuators.containsKey(ACTUATOR_RELAY_ID)) {
      bool state = actuators[ACTUATOR_RELAY_ID].as<bool>();
      actuatorStates[0] = state;
      digitalWrite(LED_PIR_PIN, state ? HIGH : LOW);
      Serial.println(state ? "Relay: ON" : "Relay: OFF");
    }

    // LED IR
    if (actuators.containsKey(ACTUATOR_LED_IR_ID)) {
      bool state = actuators[ACTUATOR_LED_IR_ID].as<bool>();
      actuatorStates[1] = state;
      digitalWrite(LED_IR_PIN, state ? HIGH : LOW);
      Serial.println(state ? "LED IR: ON" : "LED IR: OFF");
    }

    // OLED
    if (actuators.containsKey(ACTUATOR_OLED_ID)) {
      bool state = actuators[ACTUATOR_OLED_ID].as<bool>();

      // chỉ xử lý khi có thay đổi
      if (actuatorStates[2] != state) {
        actuatorStates[2] = state;
        oledEnabled = state;

        if (!state) {
          display.clearDisplay();
          display.display();
        }

        Serial.println(state ? "OLED: ON" : "OLED: OFF");
      }
    }

    Serial.println("Actuator states updated");
  }
}


/**
 * Đăng ký thiết bị với server qua MQTT
 */
void registerDevice() {
  if (!mqttClient.connected()) {
    return;
  }

  Serial.println("Registering device...");

  DynamicJsonDocument doc(2048);
  doc["device_id"] = DEVICE_ID_NUM;
  doc["name"] = DEVICE_NAME;
  doc["type"] = DEVICE_TYPE;
  doc["ip"] = WiFi.localIP().toString();

  // Sensors - chỉ cần gửi type, server tự set unit/name/threshold
  JsonArray sensors = doc.createNestedArray("sensors");
  
  JsonObject sensorTemp = sensors.createNestedObject();
  sensorTemp["sensor_id"] = SENSOR_TEMP_ID;
  sensorTemp["type"] = "temperature";
  sensorTemp["pin"] = DHTPIN;

  JsonObject sensorHum = sensors.createNestedObject();
  sensorHum["sensor_id"] = SENSOR_HUMIDITY_ID;
  sensorHum["type"] = "humidity";
  sensorHum["pin"] = DHTPIN;

  JsonObject sensorPir = sensors.createNestedObject();
  sensorPir["sensor_id"] = SENSOR_PIR_ID;
  sensorPir["type"] = "motion";
  sensorPir["pin"] = PIR_PIN;

  // Actuators
  JsonArray actuators = doc.createNestedArray("actuators");
  
  JsonObject actuatorRelay = actuators.createNestedObject();
  actuatorRelay["actuator_id"] = ACTUATOR_RELAY_ID;
  actuatorRelay["type"] = "relay";
  actuatorRelay["name"] = "Relay PIR";
  actuatorRelay["pin"] = LED_PIR_PIN;

  JsonObject actuatorLed = actuators.createNestedObject();
  actuatorLed["actuator_id"] = ACTUATOR_LED_IR_ID;
  actuatorLed["type"] = "led";
  actuatorLed["name"] = "LED IR";
  actuatorLed["pin"] = LED_IR_PIN;

  JsonObject actuatorOled = actuators.createNestedObject();
  actuatorOled["actuator_id"] = ACTUATOR_OLED_ID;
  actuatorOled["type"] = "display";
  actuatorOled["name"] = "OLED 128x64";
  actuatorOled["pin"] = 21; // SDA

  String payload;
  serializeJson(doc, payload);

  String topic = "device/register";
  bool result = mqttClient.publish(topic.c_str(), payload.c_str(), false);
  
  Serial.print("Register published: ");
  Serial.println(result ? "OK" : "FAIL");
  Serial.print("Payload: ");
  Serial.println(payload);
}

/**
 * Gửi dữ liệu sensor và actuator lên server
 */
void sendSensorData() {
  if (!mqttClient.connected() || !deviceEnabled) {
    return;
  }

  DynamicJsonDocument doc(1024);
  doc["device_id"] = DEVICE_ID_NUM;

  // Sensors - chỉ gửi sensors đang enabled
  JsonArray sensors = doc.createNestedArray("sensors");

  if (sensorStates[0] && !isnan(temperature)) {
    JsonObject temp = sensors.createNestedObject();
    temp["sensor_id"] = SENSOR_TEMP_ID;
    temp["value"] = temperature;
  }

  if (sensorStates[1] && !isnan(humidity)) {
    JsonObject hum = sensors.createNestedObject();
    hum["sensor_id"] = SENSOR_HUMIDITY_ID;
    hum["value"] = humidity;
  }

  if (sensorStates[2]) {
    JsonObject pir = sensors.createNestedObject();
    pir["sensor_id"] = SENSOR_PIR_ID;
    pir["value"] = pirState ? 1 : 0;
  }

  // Actuators - gửi trạng thái hiện tại
  JsonArray actuators = doc.createNestedArray("actuators");

  JsonObject relay = actuators.createNestedObject();
  relay["actuator_id"] = ACTUATOR_RELAY_ID;
  relay["state"] = actuatorStates[0];

  JsonObject led = actuators.createNestedObject();
  led["actuator_id"] = ACTUATOR_LED_IR_ID;
  led["state"] = actuatorStates[1];

  JsonObject oled = actuators.createNestedObject();
  oled["actuator_id"] = ACTUATOR_OLED_ID;
  oled["state"] = oledEnabled;

  String payload;
  serializeJson(doc, payload);

  String topic = "device/" + DEVICE_ID_NUM + "/data";
  bool result = mqttClient.publish(topic.c_str(), payload.c_str(), false);

  Serial.print("Data published: ");
  Serial.println(result ? "OK" : "FAIL");
  Serial.print("Payload: ");
  Serial.println(payload);
}

// ==================== HÀM SENSOR ====================

/**
 * Đọc dữ liệu từ DHT11
 */
void readDHT() {
  if (!sensorStates[0] && !sensorStates[1]) {
    return; // Cả temperature và humidity đều tắt
  }

  temperature = dht.readTemperature();
  humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT read failed!");
    return;
  }
}

/**
 * Đọc dữ liệu từ PIR sensor
 */
void readPIR() {
  if (!sensorStates[2]) {
    return;
  }
  pirState = digitalRead(PIR_PIN) == HIGH;
}

/**
 * Đọc dữ liệu từ IR sensor
 */
void readIR() {
  if (!sensorStates[3]) {
    return;
  }
  irState = digitalRead(IR_PIN) == LOW; // LOW = có vật cản
}

/**
 * Đọc tất cả sensors
 */
void readAllSensors() {
  unsigned long now = millis();
  
  if (now - lastDHT >= DHT_INTERVAL) {
    lastDHT = now;
    readDHT();
  }

  readPIR();
  readIR();
}

// ==================== HÀM ACTUATOR ====================

/**
 * Tắt tất cả sensors
 */
void turnOffAllSensors() {
  for (int i = 0; i < 4; i++) {
    sensorStates[i] = false;
  }
  Serial.println("All sensors turned OFF");
}

/**
 * Tắt tất cả actuators
 */
void turnOffAllActuators() {
  actuatorStates[0] = false;
  actuatorStates[1] = false;
  digitalWrite(LED_PIR_PIN, LOW);
  digitalWrite(LED_IR_PIN, LOW);
  Serial.println("All actuators turned OFF");
}

// ==================== HÀM OLED ====================

/**
 * Cập nhật màn hình OLED
 */
void updateOLED() {
  if (!oledEnabled) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  /* ===== HELLO CHẠY ===== */
  display.setTextSize(2);
  display.setCursor(helloX, 0);
  display.print("HELLO");

  if (helloMoveRight) {
    helloX += helloStep;
    if (helloX >= SCREEN_WIDTH - 60) helloMoveRight = false;
  } else {
    helloX -= helloStep;
    if (helloX <= 0) helloMoveRight = true;
  }

  /* ===== DATA ===== */
  display.setTextSize(1);
  display.setCursor(0, 30);

  display.print("T: ");
  if (!isnan(temperature)) {
    display.print(temperature);
    display.println(" C");
  } else {
    display.println("--");
  }

  display.print("H: ");
  if (!isnan(humidity)) {
    display.print(humidity);
    display.println(" %");
  } else {
    display.println("--");
  }

  display.print("PIR: ");
  display.println(pirState ? "ON" : "OFF");

  display.print("IR : ");
  display.println(irState ? "BLOCK" : "CLEAR");

  display.print("WiFi: ");
  display.println(WiFi.status() == WL_CONNECTED ? "OK" : "FAIL");

  display.display();
}


// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  randomSeed(esp_random());

  DEVICE_ID_NUM        = makeId("25"); // device
  SENSOR_TEMP_ID       = makeId("11"); // temperature
  SENSOR_HUMIDITY_ID   = makeId("12"); // humidity
  ACTUATOR_RELAY_ID    = makeId("21"); // relay
  ACTUATOR_LED_IR_ID   = makeId("22"); // IR LED
  ACTUATOR_OLED_ID     = makeId("23"); // OLED

  delay(1000);

  Serial.println("=== ESP32 Smart Home Device ===");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID_NUM);

  // Khởi tạo GPIO
  pinMode(PIR_PIN, INPUT);
  pinMode(IR_PIN, INPUT);
  pinMode(LED_PIR_PIN, OUTPUT);
  pinMode(LED_IR_PIN, OUTPUT);
  digitalWrite(LED_PIR_PIN, LOW);
  digitalWrite(LED_IR_PIN, LOW);

  // Khởi tạo I2C cho OLED
  Wire.begin(21, 22);

  // Khởi tạo OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED initialization failed!");
    while (1) delay(1000);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();
  delay(1000);

  // Khởi tạo DHT11
  dht.begin();
  Serial.println("DHT11 initialized");

  // Cấu hình MQTT
  espClient.setInsecure(); // Bỏ qua SSL certificate verification
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMQTTMessage);
  mqttClient.setBufferSize(MQTT_MAX_PACKET_SIZE);
  Serial.println("MQTT client configured");

  // Thử kết nối WiFi tự động
  tryAutoConnectWiFi();

  Serial.println("Setup complete!");
}

// ==================== LOOP ====================

void loop() {
  // Xử lý setup mode
  if (isSetupMode) {
    server.handleClient();
    return;
  }

  unsigned long now = millis();

  // Kiểm tra WiFi
  checkWiFiStatus();

  // Kết nối và duy trì MQTT
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      connectMQTT();
    } else {
      mqttClient.loop();
    }
  }

  // Đọc sensors
  readAllSensors();

  // Gửi dữ liệu MQTT định kỳ
  if (WiFi.status() == WL_CONNECTED && mqttClient.connected() && deviceEnabled) {
    if (now - lastMQTT >= MQTT_DATA_INTERVAL) {
      lastMQTT = now;
      sendSensorData();
    }
  }

  // Cập nhật OLED
  if (now - lastOLED >= OLED_INTERVAL) {
    lastOLED = now;
    updateOLED();
  }

  delay(10);
}

/*
 * ESP32 Smart Home Device
 * Tích hợp với hệ thống IoT qua MQTT
 * 
 * Chức năng:
 * - Kết nối WiFi (tự động hoặc setup mode)
 * - Kết nối MQTT với TLS/SSL
 * - Đăng ký thiết bị qua MQTT
 * - Gửi dữ liệu sensor/actuator định kỳ
 * - Nhận và xử lý lệnh từ server
 * - Last Will and Testament (LWT)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ==================== CẤU HÌNH MQTT ====================
#define MQTT_BROKER "707d6798baa54e22a0d6a43694d39e47.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USERNAME "ngohai"
#define MQTT_PASSWORD "NgoHai0804"
#define MQTT_MAX_PACKET_SIZE 2048

// ==================== CẤU HÌNH THIẾT BỊ ====================
String DEVICE_ID_NUM; // Device tự tạo ID duy nhất
String DEVICE_NAME = "ESP32 Smart Home";
String DEVICE_TYPE = "esp32";

// ==================== CẤU HÌNH SENSORS ====================
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define PIR_PIN 27
#define IR_PIN 33

// Sensor IDs
String SENSOR_TEMP_ID ;
String SENSOR_HUMIDITY_ID ;
String SENSOR_PIR_ID ;

// ==================== CẤU HÌNH ACTUATORS ====================
#define LED_PIR_PIN 26
#define LED_IR_PIN 32

// Actuator IDs
String ACTUATOR_RELAY_ID ;
String ACTUATOR_LED_IR_ID ;
String ACTUATOR_OLED_ID ;

// ==================== CẤU HÌNH OLED ====================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool oledEnabled = true;

// ==================== CẤU HÌNH THỜI GIAN ====================
const unsigned long DHT_INTERVAL = 2000;      // Đọc DHT mỗi 2 giây
const unsigned long MQTT_DATA_INTERVAL = 5000; // Gửi dữ liệu MQTT mỗi 5 giây
const unsigned long OLED_INTERVAL = 1000;      // Cập nhật OLED mỗi 1 giây
const unsigned long WIFI_CONNECT_TIMEOUT = 30000;
const unsigned long WIFI_LOST_TIMEOUT = 30000;

unsigned long lastDHT = 0;
unsigned long lastMQTT = 0;
unsigned long lastOLED = 0;

// ==================== BIẾN TRẠNG THÁI ====================
float temperature = NAN;
float humidity = NAN;
bool pirState = false;
bool irState = false;

bool deviceEnabled = true;
bool sensorStates[3] = {true, true , true}; // temp, humidity, pir
bool actuatorStates[3] = {false, false , true};         // relay, led_ir , oled

bool mqttConnected = false;
bool deviceRegistered = false;
bool mqttRegisterSent = false;
int helloX = 0;
int helloStep = 2;
bool helloMoveRight = true;

// ==================== WIFI SETUP MODE ====================
const char *AP_SSID = "ESP32_AP";
const char *AP_PASSWORD = "12345678";
bool isSetupMode = false;
bool wasConnected = false;
unsigned long wifiLostTime = 0;

WebServer server(80);
Preferences prefs;

// Form HTML cho WiFi setup
const char *htmlForm = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ESP32 WiFi Setup</title>
  <style>
    body { font-family: Arial; margin: 40px; }
    input { padding:8px; margin:6px 0; width: 100%; box-sizing: border-box; }
    button { padding:10px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    .container { max-width:400px; margin:auto; }
  </style>
</head>
<body>
  <div class="container">
    <h2>WiFi Setup</h2>
    <form action="/connect" method="post">
      <label>SSID:</label>
      <input type="text" name="ssid" required>
      <label>Password:</label>
      <input type="password" name="password">
      <button type="submit">Connect</button>
    </form>
  </div>
</body>
</html>
)rawliteral";
//sinh id ngẫu nhiên
String makeId(const String &prefix)
{
  int rnd = random(0, 100); // 00 - 99
  char buf[5];
  sprintf(buf, "%02d", rnd);
  return prefix + String(buf);
}

// ==================== MQTT CLIENT ====================
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// ==================== HÀM WIFI ====================

/**
 * Xử lý request root (hiển thị form)
 */
void handleRoot() {
  server.send(200, "text/html", htmlForm);
}

/**
 * Xử lý request connect WiFi
 */
void handleConnect() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }

  String ssid = server.arg("ssid");
  String password = server.arg("password");

  server.send(200, "text/html", "<html><body><h3>Connecting to " + ssid + "...</h3></body></html>");

  // Lưu credentials
  prefs.begin("wifi", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", password);
  prefs.end();

  // Kết nối WiFi
  connectWiFi(ssid, password);
}

/**
 * Xử lý 404
 */
void handleNotFound() {
  server.send(404, "text/plain", "404: Not found");
}

/**
 * Kết nối WiFi với SSID và password
 */
void connectWiFi(String ssid, String password) {
  WiFi.disconnect(true);
  delay(500);

  WiFi.mode(WIFI_AP_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid.c_str(), password.c_str());

  unsigned long start = millis();
  while (millis() - start < WIFI_CONNECT_TIMEOUT) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi connected!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      WiFi.softAPdisconnect(true);
      isSetupMode = false;
      server.stop();
      return;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connection failed!");
  startSetupMode();
}

/**
 * Thử kết nối WiFi từ credentials đã lưu
 */
void tryAutoConnectWiFi() {
  prefs.begin("wifi", true);
  String ssid = prefs.getString("ssid", "");
  String pass = prefs.getString("pass", "");
  prefs.end();

  if (ssid.length() > 0) {
    Serial.print("Auto-connecting to: ");
    Serial.println(ssid);
    connectWiFi(ssid, pass);
  } else {
    Serial.println("No saved WiFi credentials - Entering setup mode");
    startSetupMode();
  }
}

/**
 * Bắt đầu setup mode (AP mode)
 */
void startSetupMode() {
  isSetupMode = true;
  Serial.println("Starting setup mode...");
  WiFi.disconnect(true);
  delay(1000);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP: ");
  Serial.println(IP);

  server.on("/", HTTP_GET, handleRoot);
  server.on("/connect", HTTP_POST, handleConnect);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("WebServer started at http://192.168.4.1/");
}

/**
 * Kiểm tra và xử lý trạng thái WiFi
 */
void checkWiFiStatus() {
  bool wifiConnected = (WiFi.status() == WL_CONNECTED);

  if (wifiConnected) {
    wasConnected = true;
    wifiLostTime = 0;
  } else {
    if (wasConnected) {
      if (wifiLostTime == 0) {
        wifiLostTime = millis();
        Serial.println("WiFi lost - Waiting 30s before setup mode...");
      } else if (millis() - wifiLostTime >= WIFI_LOST_TIMEOUT) {
        Serial.println("WiFi lost too long - Entering setup mode");
        startSetupMode();
      }
    }
  }
}

// ==================== HÀM MQTT ====================

/**
 * Callback khi kết nối MQTT thành công
 */
void onMQTTConnect() {
  Serial.println("MQTT connected!");
  mqttConnected = true;

  // Subscribe topic command
  String commandTopic = "device/" + DEVICE_ID_NUM + "/command";
  mqttClient.subscribe(commandTopic.c_str(), 1);
  Serial.println("Subscribed to: " + commandTopic);

  // Subscribe topic register response
  String responseTopic = "device/" + DEVICE_ID_NUM + "/register/response";
  mqttClient.subscribe(responseTopic.c_str(), 1);
  Serial.println("Subscribed to: " + responseTopic);
}

/**
 * Kết nối MQTT
 */
void connectMQTT() {
  if (mqttClient.connected()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.print("Connecting to MQTT broker...");

  String clientId = "ESP32-" + DEVICE_ID_NUM + "-" + String(random(0xffff), HEX);

  String lwtTopic = "device/" + DEVICE_ID_NUM + "/lwt";
  String lwtPayload = "{\"status\":\"offline\"}";

  bool connected = mqttClient.connect(
    clientId.c_str(),
    MQTT_USERNAME,
    MQTT_PASSWORD,
    lwtTopic.c_str(),   // will topic
    1,                  // QoS
    false,              // retain
    lwtPayload.c_str()  // will message
  );

  if (connected) {
    Serial.println("MQTT connected!");
    mqttConnected = true;
    onMQTTConnect();

    if (!mqttRegisterSent) {
      delay(500);
      registerDevice();
      mqttRegisterSent = true;
    }
  } else {
    Serial.print(" failed, state=");
    Serial.println(mqttClient.state());
    mqttConnected = false;
  }
}


/**
 * Callback khi nhận message từ MQTT
 */
void onMQTTMessage(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Received MQTT message: ");
  Serial.print(topic);
  Serial.print(" - ");
  Serial.println(message);

  String topicStr = String(topic);

  // Xử lý register response
  if (topicStr.indexOf("/register/response") >= 0) {
    handleRegisterResponse(message);
    return;
  }

  // Xử lý command
  if (topicStr.indexOf("/command") >= 0) {
    handleCommand(message);
    return;
  }
}

/**
 * Xử lý response đăng ký thiết bị
 */
void handleRegisterResponse(String payload) {
  DynamicJsonDocument doc(512);
  deserializeJson(doc, payload);

  if (doc["status"] == "success") {
    deviceRegistered = true;
    Serial.println("Device registered successfully!");
    Serial.print("Device ID: ");
    Serial.println(doc["device_id"].as<String>());
  } else {
    Serial.println("Device registration failed!");
    deviceRegistered = false;
  }
}

/**
 * Xử lý lệnh từ server
 */
void handleCommand(String payload) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);

  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  /* ===== DEVICE ENABLE ===== */
  if (doc.containsKey("device_enabled")) {
    deviceEnabled = doc["device_enabled"].as<bool>();
    Serial.print("Device enabled: ");
    Serial.println(deviceEnabled ? "ON" : "OFF");

    if (!deviceEnabled) {
      turnOffAllSensors();
      turnOffAllActuators();
    }
  }

  /* ===== SENSORS ===== */
  if (doc.containsKey("sensors") && deviceEnabled) {
    JsonObject sensors = doc["sensors"];

    if (sensors.containsKey(SENSOR_TEMP_ID))
      sensorStates[0] = sensors[SENSOR_TEMP_ID].as<bool>();

    if (sensors.containsKey(SENSOR_HUMIDITY_ID))
      sensorStates[1] = sensors[SENSOR_HUMIDITY_ID].as<bool>();

    if (sensors.containsKey(SENSOR_PIR_ID))
      sensorStates[2] = sensors[SENSOR_PIR_ID].as<bool>();

    Serial.println("Sensor states updated");
  }

  /* ===== ACTUATORS ===== */
  if (doc.containsKey("actuators") && deviceEnabled) {
    JsonObject actuators = doc["actuators"];

    // Relay
    if (actuators.containsKey(ACTUATOR_RELAY_ID)) {
      bool state = actuators[ACTUATOR_RELAY_ID].as<bool>();
      actuatorStates[0] = state;
      digitalWrite(LED_PIR_PIN, state ? HIGH : LOW);
      Serial.println(state ? "Relay: ON" : "Relay: OFF");
    }

    // LED IR
    if (actuators.containsKey(ACTUATOR_LED_IR_ID)) {
      bool state = actuators[ACTUATOR_LED_IR_ID].as<bool>();
      actuatorStates[1] = state;
      digitalWrite(LED_IR_PIN, state ? HIGH : LOW);
      Serial.println(state ? "LED IR: ON" : "LED IR: OFF");
    }

    // OLED
    if (actuators.containsKey(ACTUATOR_OLED_ID)) {
      bool state = actuators[ACTUATOR_OLED_ID].as<bool>();

      // chỉ xử lý khi có thay đổi
      if (actuatorStates[2] != state) {
        actuatorStates[2] = state;
        oledEnabled = state;

        if (!state) {
          display.clearDisplay();
          display.display();
        }

        Serial.println(state ? "OLED: ON" : "OLED: OFF");
      }
    }

    Serial.println("Actuator states updated");
  }
}


/**
 * Đăng ký thiết bị với server qua MQTT
 */
void registerDevice() {
  if (!mqttClient.connected()) {
    return;
  }

  Serial.println("Registering device...");

  DynamicJsonDocument doc(2048);
  doc["device_id"] = DEVICE_ID_NUM;
  doc["name"] = DEVICE_NAME;
  doc["type"] = DEVICE_TYPE;
  doc["ip"] = WiFi.localIP().toString();

  // Sensors - chỉ cần gửi type, server tự set unit/name/threshold
  JsonArray sensors = doc.createNestedArray("sensors");
  
  JsonObject sensorTemp = sensors.createNestedObject();
  sensorTemp["sensor_id"] = SENSOR_TEMP_ID;
  sensorTemp["type"] = "temperature";
  sensorTemp["pin"] = DHTPIN;

  JsonObject sensorHum = sensors.createNestedObject();
  sensorHum["sensor_id"] = SENSOR_HUMIDITY_ID;
  sensorHum["type"] = "humidity";
  sensorHum["pin"] = DHTPIN;

  JsonObject sensorPir = sensors.createNestedObject();
  sensorPir["sensor_id"] = SENSOR_PIR_ID;
  sensorPir["type"] = "motion";
  sensorPir["pin"] = PIR_PIN;

  // Actuators
  JsonArray actuators = doc.createNestedArray("actuators");
  
  JsonObject actuatorRelay = actuators.createNestedObject();
  actuatorRelay["actuator_id"] = ACTUATOR_RELAY_ID;
  actuatorRelay["type"] = "relay";
  actuatorRelay["name"] = "Relay PIR";
  actuatorRelay["pin"] = LED_PIR_PIN;

  JsonObject actuatorLed = actuators.createNestedObject();
  actuatorLed["actuator_id"] = ACTUATOR_LED_IR_ID;
  actuatorLed["type"] = "led";
  actuatorLed["name"] = "LED IR";
  actuatorLed["pin"] = LED_IR_PIN;

  JsonObject actuatorOled = actuators.createNestedObject();
  actuatorOled["actuator_id"] = ACTUATOR_OLED_ID;
  actuatorOled["type"] = "display";
  actuatorOled["name"] = "OLED 128x64";
  actuatorOled["pin"] = 21; // SDA

  String payload;
  serializeJson(doc, payload);

  String topic = "device/register";
  bool result = mqttClient.publish(topic.c_str(), payload.c_str(), false);
  
  Serial.print("Register published: ");
  Serial.println(result ? "OK" : "FAIL");
  Serial.print("Payload: ");
  Serial.println(payload);
}

/**
 * Gửi dữ liệu sensor và actuator lên server
 */
void sendSensorData() {
  if (!mqttClient.connected() || !deviceEnabled) {
    return;
  }

  DynamicJsonDocument doc(1024);
  doc["device_id"] = DEVICE_ID_NUM;

  // Sensors - chỉ gửi sensors đang enabled
  JsonArray sensors = doc.createNestedArray("sensors");

  if (sensorStates[0] && !isnan(temperature)) {
    JsonObject temp = sensors.createNestedObject();
    temp["sensor_id"] = SENSOR_TEMP_ID;
    temp["value"] = temperature;
  }

  if (sensorStates[1] && !isnan(humidity)) {
    JsonObject hum = sensors.createNestedObject();
    hum["sensor_id"] = SENSOR_HUMIDITY_ID;
    hum["value"] = humidity;
  }

  if (sensorStates[2]) {
    JsonObject pir = sensors.createNestedObject();
    pir["sensor_id"] = SENSOR_PIR_ID;
    pir["value"] = pirState ? 1 : 0;
  }

  // Actuators - gửi trạng thái hiện tại
  JsonArray actuators = doc.createNestedArray("actuators");

  JsonObject relay = actuators.createNestedObject();
  relay["actuator_id"] = ACTUATOR_RELAY_ID;
  relay["state"] = actuatorStates[0];

  JsonObject led = actuators.createNestedObject();
  led["actuator_id"] = ACTUATOR_LED_IR_ID;
  led["state"] = actuatorStates[1];

  JsonObject oled = actuators.createNestedObject();
  oled["actuator_id"] = ACTUATOR_OLED_ID;
  oled["state"] = oledEnabled;

  String payload;
  serializeJson(doc, payload);

  String topic = "device/" + DEVICE_ID_NUM + "/data";
  bool result = mqttClient.publish(topic.c_str(), payload.c_str(), false);

  Serial.print("Data published: ");
  Serial.println(result ? "OK" : "FAIL");
  Serial.print("Payload: ");
  Serial.println(payload);
}

// ==================== HÀM SENSOR ====================

/**
 * Đọc dữ liệu từ DHT11
 */
void readDHT() {
  if (!sensorStates[0] && !sensorStates[1]) {
    return; // Cả temperature và humidity đều tắt
  }

  temperature = dht.readTemperature();
  humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT read failed!");
    return;
  }
}

/**
 * Đọc dữ liệu từ PIR sensor
 */
void readPIR() {
  if (!sensorStates[2]) {
    return;
  }
  pirState = digitalRead(PIR_PIN) == HIGH;
}

/**
 * Đọc dữ liệu từ IR sensor
 */
void readIR() {
  if (!sensorStates[3]) {
    return;
  }
  irState = digitalRead(IR_PIN) == LOW; // LOW = có vật cản
}

/**
 * Đọc tất cả sensors
 */
void readAllSensors() {
  unsigned long now = millis();
  
  if (now - lastDHT >= DHT_INTERVAL) {
    lastDHT = now;
    readDHT();
  }

  readPIR();
  readIR();
}

// ==================== HÀM ACTUATOR ====================

/**
 * Tắt tất cả sensors
 */
void turnOffAllSensors() {
  for (int i = 0; i < 4; i++) {
    sensorStates[i] = false;
  }
  Serial.println("All sensors turned OFF");
}

/**
 * Tắt tất cả actuators
 */
void turnOffAllActuators() {
  actuatorStates[0] = false;
  actuatorStates[1] = false;
  digitalWrite(LED_PIR_PIN, LOW);
  digitalWrite(LED_IR_PIN, LOW);
  Serial.println("All actuators turned OFF");
}

// ==================== HÀM OLED ====================

/**
 * Cập nhật màn hình OLED
 */
void updateOLED() {
  if (!oledEnabled) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  /* ===== HELLO CHẠY ===== */
  display.setTextSize(2);
  display.setCursor(helloX, 0);
  display.print("HELLO");

  if (helloMoveRight) {
    helloX += helloStep;
    if (helloX >= SCREEN_WIDTH - 60) helloMoveRight = false;
  } else {
    helloX -= helloStep;
    if (helloX <= 0) helloMoveRight = true;
  }

  /* ===== DATA ===== */
  display.setTextSize(1);
  display.setCursor(0, 30);

  display.print("T: ");
  if (!isnan(temperature)) {
    display.print(temperature);
    display.println(" C");
  } else {
    display.println("--");
  }

  display.print("H: ");
  if (!isnan(humidity)) {
    display.print(humidity);
    display.println(" %");
  } else {
    display.println("--");
  }

  display.print("PIR: ");
  display.println(pirState ? "ON" : "OFF");

  display.print("IR : ");
  display.println(irState ? "BLOCK" : "CLEAR");

  display.print("WiFi: ");
  display.println(WiFi.status() == WL_CONNECTED ? "OK" : "FAIL");

  display.display();
}


// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  randomSeed(esp_random());

  DEVICE_ID_NUM        = makeId("25"); // device
  SENSOR_TEMP_ID       = makeId("11"); // temperature
  SENSOR_HUMIDITY_ID   = makeId("12"); // humidity
  ACTUATOR_RELAY_ID    = makeId("21"); // relay
  ACTUATOR_LED_IR_ID   = makeId("22"); // IR LED
  ACTUATOR_OLED_ID     = makeId("23"); // OLED

  delay(1000);

  Serial.println("=== ESP32 Smart Home Device ===");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID_NUM);

  // Khởi tạo GPIO
  pinMode(PIR_PIN, INPUT);
  pinMode(IR_PIN, INPUT);
  pinMode(LED_PIR_PIN, OUTPUT);
  pinMode(LED_IR_PIN, OUTPUT);
  digitalWrite(LED_PIR_PIN, LOW);
  digitalWrite(LED_IR_PIN, LOW);

  // Khởi tạo I2C cho OLED
  Wire.begin(21, 22);

  // Khởi tạo OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED initialization failed!");
    while (1) delay(1000);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();
  delay(1000);

  // Khởi tạo DHT11
  dht.begin();
  Serial.println("DHT11 initialized");

  // Cấu hình MQTT
  espClient.setInsecure(); // Bỏ qua SSL certificate verification
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMQTTMessage);
  mqttClient.setBufferSize(MQTT_MAX_PACKET_SIZE);
  Serial.println("MQTT client configured");

  // Thử kết nối WiFi tự động
  tryAutoConnectWiFi();

  Serial.println("Setup complete!");
}

// ==================== LOOP ====================

void loop() {
  // Xử lý setup mode
  if (isSetupMode) {
    server.handleClient();
    return;
  }

  unsigned long now = millis();

  // Kiểm tra WiFi
  checkWiFiStatus();

  // Kết nối và duy trì MQTT
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      connectMQTT();
    } else {
      mqttClient.loop();
    }
  }

  // Đọc sensors
  readAllSensors();

  // Gửi dữ liệu MQTT định kỳ
  if (WiFi.status() == WL_CONNECTED && mqttClient.connected() && deviceEnabled) {
    if (now - lastMQTT >= MQTT_DATA_INTERVAL) {
      lastMQTT = now;
      sendSensorData();
    }
  }

  // Cập nhật OLED
  if (now - lastOLED >= OLED_INTERVAL) {
    lastOLED = now;
    updateOLED();
  }

  delay(10);
}


​