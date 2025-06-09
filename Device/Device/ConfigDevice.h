const char Config_html[] PROGMEM = R"rawliteral(
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Config</title>
  </head>
  <body>
    <style>
      *{margin: 0; padding: 0; box-sizing: border-box; font-family: "Nunito", sans-serif;
      font-size: 14px;font-weight: 500; font-optical-sizing: auto;font-style: normal;color: white;}
      body{height: 100vh; background: #0E0F14; display: flex; justify-content: center; }
      body form{width: 300px}
      body form p{font-size: 24px; font-weight: bold; margin: 30px auto; text-align: center;}
      body form label{font-weight: bold;}
      body form input{width: 100%;height: 30px; border: none; border-radius: 5px; margin-top: 5px;
        margin-bottom: 15px; padding: 10px; color: black;}
      body form button{background: #3A3A3A; border: none; border-radius: 5px; font-weight: bold; 
        width: 100%; height: 30px; margin-top: 20px;}
    </style>
    <form action="/get">
      <p> CHECK-IN CONFIG</p>
      <label>WiFi SSID</label></br>
      <input type="text" maxlength="15" name="wifi_ssid"></br>
      <label>WiFi password</label></br>
      <input type="text" maxlength="15" name="wifi_password"></br>
      <label>Email</label></br>
      <input type="text" maxlength="50" name="email"></br>
      <label>Password</label></br>
      <input type="text" maxlength="50" name="password"></br>
      <label>Database URL</label></br>
      <input type="text" maxlength="80" name="database_url"></br>
      <label>Database secrets</label></br>
      <input type="text" maxlength="50" name="database_secrets"></br>
      <label>API key</label></br>
      <input type="text" maxlength="50" name="api_key"></br>
      <button class="submit-button" id="user-submit">SUBMIT</button></br>
    </form>
  </body>
  </html>
)rawliteral";