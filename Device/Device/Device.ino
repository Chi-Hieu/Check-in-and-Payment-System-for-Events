#include <WiFi.h>
#include <WebServer.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <FirebaseESP32.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include "time.h"
#include "ConfigDevice.h"
#include <EEPROM.h>

#define RFID_SS 16
#define RFID_RST 17

uint8_t WIFI_SSID_ADDRESS = 0;
uint8_t WIFI_PASSWORD_ADDRESS = 15;
uint8_t DATABASE_URL_ADDRESS = 30;
uint8_t DATABASE_SECRETS_ADDRESS = 110;
uint8_t API_KEY_ADDRESS = 160;
uint8_t USER_EMAIL_ADDRESS = 210;
uint8_t USER_PASSWORD_ADDRESS = 240;

String WIFI_SSID;
String WIFI_PASSWORD;
String DATABASE_URL;
String DATABASE_SECRETS;
String API_KEY;
String USER_EMAIL;
String USER_PASSWORD;

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 21600;
const int daylightOffset_sec = 3600;

FirebaseData firebase;
FirebaseAuth auth;
FirebaseConfig config;
WebServer server(80);
MFRC522 rfid(RFID_SS, RFID_RST);
LiquidCrystal_I2C lcd(0x27, 16, 2);

String UID = "";
String Username, TicketType, Status, Balance;

void setup() {
  Serial.begin(115200);
  EEPROM.begin(500);
  SPI.begin();
  rfid.PCD_Init();
  lcd.init();
  lcd.backlight();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  pinMode(0, INPUT);

  WIFI_SSID = readdataeeprom(WIFI_SSID_ADDRESS);
  WIFI_PASSWORD = readdataeeprom(WIFI_PASSWORD_ADDRESS);
  DATABASE_URL = readdataeeprom(DATABASE_URL_ADDRESS);
  DATABASE_SECRETS = readdataeeprom(DATABASE_SECRETS_ADDRESS);
  API_KEY = readdataeeprom(API_KEY_ADDRESS);
  USER_EMAIL = readdataeeprom(USER_EMAIL_ADDRESS);
  USER_PASSWORD = readdataeeprom(USER_PASSWORD_ADDRESS);

  connectwifi();
  connectfirebase();
}

void loop() {
  UID = "";
  Username = "";
  TicketType = "";
  Status = "";
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("TAP YOUR TICKET");

  Firebase.setString(firebase, "/Devices/1/Type", String("Check-in"));

  while (UID == "") {
    readcard();
  }
  lcd.setCursor(4, 1);
  lcd.print(UID);
  if (UID == "C3D6B814") {
    addticket();
  }

  else {
    if (Firebase.getString(firebase, "/Users/" + UID + "/Name")) {
      Username = firebase.stringData();
      Serial.print(Username + " ");
      lcd.clear();

      if (Firebase.getString(firebase, "/Users/" + UID + "/Type")) {
        TicketType = firebase.stringData();
        TicketType.trim();
        Serial.println(TicketType);

        if (Firebase.getString(firebase, "/Users/" + UID + "/Status")) {
          Status = firebase.stringData();
          lcd.clear();

          if (TicketType == "EA") {
            if (Status == "0" && gettime("hour") < 16) {
              Firebase.setString(firebase, "/Users/" + UID + "/Status", String("1"));
              lcd.setCursor(6, 1);
              lcd.print("WELCOME");
            }

            else {
              for (int i = 0; i < 5; i++) {
                lcd.setCursor(0, 0);
                lcd.print("EA TICKET 1 TIME");
                lcd.setCursor(0, 1);
                lcd.print("ENTRY BEFORE 4PM");
                delay(500);
                lcd.clear();
                delay(500);
              }
              return;
            }

          } else {
            Firebase.setString(firebase, "/Users/" + UID + "/Status", String(Status.toInt() + 1));
            lcd.setCursor(6, 1);
            lcd.print("WELCOME");
          }
        }
      }
      lcd.setCursor(0, 1);
      lcd.print(TicketType);
      if (Username.length() > 16) {
        for (int i = 0; i < Username.length() - 15; i++) {
          lcd.setCursor(0, 0);
          lcd.print(Username.substring(i, i + 16));
          delay(300);
        }
      }

      else {
        lcd.setCursor(0, 0);
        lcd.print(Username);
        delay(1000);
      }
      delay(2000);
      lcd.clear();
    } 
    
    else {
      for (int i = 0; i < 5; i++) {
        lcd.setCursor(0, 0);
        lcd.print("TICKET NOT FOUND");
        lcd.setCursor(0, 1);
        lcd.print("PLEASE TRY AGAIN");
        delay(500);
        lcd.clear();
        delay(500);
      }
    }
  }
}

void connectwifi() {
  Serial.print("WiFi: ");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WIFI");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int i = 0;
  while (WiFi.status() != WL_CONNECTED) {
    for (int i = 3; i < 12; i++) {
      lcd.setCursor(i, 1);
      lcd.print(".");
      delay(50);
    }
    for (int i = 3; i < 12; i++) {
      lcd.setCursor(i, 1);
      lcd.print(" ");
      delay(50);
    }
    i++;
    if (i == 5) {
      Serial.println("Fail");
      lcd.setCursor(0, 1);
      lcd.print("CONNECTION FAIL");
      delay(2000);
      lcd.clear();
      configdevice();
      connectwifi();
      return;
    }
  }
  Serial.println("Done");
  lcd.setCursor(2, 1);
  lcd.print("SUCCESSFULLY");
  delay(2000);
  lcd.clear();
}

void configdevice() {
  Serial.print("Config: ");
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Config device");
  IPAddress IP = WiFi.softAPIP();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("CONFIG");
  lcd.setCursor(0, 1);
  lcd.print("IP: ");
  lcd.setCursor(4, 1);
  lcd.print(IP);

  bool i = true;
  std::function<void()> handleGet = [&]() {
    String a, b, c, d, e, f, g;
    a = server.arg("wifi_ssid").c_str();
    a.trim();
    if (a != WIFI_SSID && a != "") {
      writedataeeprom(WIFI_SSID_ADDRESS, a);
    }
    b = server.arg("wifi_password").c_str();
    b.trim();
    if (b != WIFI_PASSWORD && b != "") {
      writedataeeprom(WIFI_PASSWORD_ADDRESS, b);
    }
    c = server.arg("email").c_str();
    c.trim();
    if (c != USER_EMAIL && c != "") {
      writedataeeprom(USER_EMAIL_ADDRESS, c);
    }
    d = server.arg("password").c_str();
    d.trim();
    if (d != USER_PASSWORD && d != "") {
      writedataeeprom(USER_PASSWORD_ADDRESS, d);
    }
    e = server.arg("database_url").c_str();
    e.trim();
    if (e != DATABASE_URL && e != "") {
      writedataeeprom(DATABASE_URL_ADDRESS, e);
    }
    f = server.arg("database_secrets").c_str();
    f.trim();
    if (f != DATABASE_SECRETS && f != "") {
      writedataeeprom(DATABASE_SECRETS_ADDRESS, f);
    }
    g = server.arg("api_key").c_str();
    g.trim();
    if (g != API_KEY && g != "") {
      writedataeeprom(API_KEY_ADDRESS, g);
    }

    server.sendHeader("Location", "/", true);
    lcd.setCursor(0, 1);
    lcd.print("  SUCCESSFULLY  ");
    Serial.println("Done");
    delay(1000);
    server.send(200, "text/html", Config_html);
    delay(1000);
    i = false;
  };

  server.on("/", []() {
    server.send(200, "text/html", Config_html);
  });

  server.on("/get", handleGet);
  server.begin();

  while (i) {
    server.handleClient();
  }
  server.stop();
  ESP.restart();
}

void connectfirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  Firebase.reconnectWiFi(true);
  firebase.setResponseSize(4096);
  config.token_status_callback = tokenStatusCallback;
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("FIREBASE");

  Firebase.reconnectWiFi(true);
  uint8_t i = 0;
  while (!Firebase.ready()) {
    Firebase.begin(&config, &auth);
    for (int i = 3; i < 12; i++) {
      lcd.setCursor(i, 1);
      lcd.print(".");
      delay(50);
    }
    for (int i = 3; i < 12; i++) {
      lcd.setCursor(i, 1);
      lcd.print(" ");
      delay(50);
    }
    i++;
    if (i == 5) {
      Serial.println("Firebase: Fail");
      lcd.setCursor(0, 1);
      lcd.print("CONNECTION FAIL");
      delay(2000);
      lcd.clear();
      configdevice();
      connectfirebase();
      return;
    }
  }

  Serial.println("Firebase: Done");
  lcd.setCursor(2, 1);
  lcd.print("SUCCESSFULLY");
  delay(2000);
  lcd.clear();
}

int gettime(const char* type) {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("No time available (yet)");
    return -1;
  }
  char buffer[3];
  if (strcmp(type, "hour") == 0) {
    strftime(buffer, 3, "%H", &timeinfo);
    return atoi(buffer);
  } else if (strcmp(type, "minute") == 0) {
    strftime(buffer, 3, "%M", &timeinfo);
    return atoi(buffer);
  } else if (strcmp(type, "second") == 0) {
    strftime(buffer, 3, "%S", &timeinfo);
    return atoi(buffer);
  }
  return -1;
}

void addticket() {
  UID = "";
  lcd.clear();
  lcd.setCursor(2, 0);
  lcd.print("ADD TICKETS");
  const char* tickets[3] = { "EA ", "GA ", "VIP" };
  uint8_t type = 0;
  while (1) {
    if (digitalRead(0) == 0) {
      delay(200);
      type++;
      if (type > 2) { type = 0; }
    }
    lcd.setCursor(0, 1);
    lcd.print(tickets[type]);
    readcard();
    if (UID != "") {
      if (UID == "C3D6B814") { cashless(); }
      lcd.setCursor(6, 1);
      lcd.print(UID);
      Firebase.setString(firebase, "/Users/" + UID + "/Name", String("{None}"));
      Firebase.setString(firebase, "/Users/" + UID + "/Balance", String("0"));
      Firebase.setString(firebase, "/Users/" + UID + "/Status", String("0"));
      Firebase.setString(firebase, "/Users/" + UID + "/Type", String(tickets[type]));
      delay(200);
      if (Firebase.get(firebase, "/Users/" + UID)) {
        Serial.println(firebase.stringData());
        lcd.setCursor(6, 1);
        lcd.print("        ");
      } else {
        lcd.setCursor(6, 1);
        lcd.print("ERROR");
        delay(2000);
        lcd.setCursor(6, 1);
        lcd.print("     ");
      }
      Serial.print("Add ticket: ");
      Serial.println(UID);
      UID = "";
    }
  }
}

void cashless() {
  Firebase.setString(firebase, "/Devices/1/Type", String("POS"));
  while(1) {
    UID = "";
    Balance = "";
    Username = "";
    String paymentStatus = "";
    String paymentPrice = "";
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("CASHLESS PAYMENT");
    while (paymentStatus != "Waiting") {
      if (Firebase.getString(firebase, "/Devices/1/Status")) {
        paymentStatus = firebase.stringData();
        UID = "";
        readcard();
        if (UID != "") {
          if (UID == "C3D6B814") { configdevice(); }
        }
        Serial.println(".");
        Serial.println(UID);
        delay(5000);
      }
    }
    if (Firebase.getString(firebase, "/Devices/1/Price")) {
      paymentPrice = firebase.stringData();
      lcd.setCursor(0, 1);
      lcd.print(paymentPrice + " VND");
      Serial.println(paymentPrice);
    }
    lcd.setCursor(0, 0);
    lcd.print("TAP YOUR TICKET ");
    while (UID == "") {
      readcard();
    }
    if (UID == "C3D6B814") { configdevice(); }
    else {
      if (Firebase.getString(firebase, "/Users/" + UID + "/Name")) {
        Username = firebase.stringData();
        if (Firebase.getString(firebase, "/Users/" + UID + "/Balance")) {
          Balance = firebase.stringData();
          lcd.clear();
          if (Balance.toInt() >= paymentPrice.toInt()) {
            Firebase.setString(firebase, "/Users/" + UID + "/Balance", String(Balance.toInt() - paymentPrice.toInt()));
            Firebase.setString(firebase, "/Devices/1/Status", String("Successfully"));
            Firebase.setString(firebase, "/Devices/1/Name", String(Username));

            String HOUR, MINUTE, SECOND, TIME;
            HOUR = gettime("hour");
            MINUTE = gettime("minute");
            SECOND = gettime("second");
            TIME = "0" + HOUR + MINUTE + SECOND + "01";
            Firebase.setString(firebase, "/Transfers/15072024/" + TIME +"/Amount", String(paymentPrice));
            Firebase.setString(firebase, "/Transfers/15072024/" + TIME +"/User", String(Username));

            lcd.setCursor(2, 1);
            lcd.print("SUCCESSFULLY");
          }
          else {
            Firebase.setString(firebase, "/Devices/1/Status", String("Not enough funds"));
            lcd.setCursor(0, 1);
            lcd.print("NOT ENOUGH FUNDS");
          }
        }
        
      }

      if (Username.length() > 16) {
        for (int i = 0; i < Username.length() - 15; i++) {
          lcd.setCursor(0, 0);
          lcd.print(Username.substring(i, i + 16));
          delay(300);
        }
      }
      else {
        lcd.setCursor(0, 0);
        lcd.print(Username);
        delay(1000);
      }
    }
    delay(3000);
  }
}

void readcard() {
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    UID = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      UID += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      UID += String(rfid.uid.uidByte[i], HEX);
      UID.toUpperCase();
    }
    rfid.PICC_HaltA();
  }
}

String readdataeeprom(uint8_t address) {
  uint8_t len = EEPROM.read(address);
  char data[len + 1];
  for (int i = 0; i < len; i++) {
    data[i] = EEPROM.read(address + 1 + i);
  }
  data[len] = '\0';
  Serial.println(String(data));
  return String(data);
}

void writedataeeprom(uint8_t address, String data) {
  uint8_t len = data.length();
  EEPROM.write(address, len);
  for (int i = 0; i < len; i++) {
    EEPROM.write(address + 1 + i, data[i]);
  }
  EEPROM.commit();
}
