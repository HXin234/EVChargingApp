/**
 * config.js
 * Central configuration for all server connection URLs.
 *
 * For Android Emulator (AVD):  use 10.0.2.2  to reach localhost on the host machine
 * For a physical device:       replace with your PC's local IP address (e.g. 192.168.x.x)
 */

const config = {
  // REST API base URL (evServer.js — port 5000)
  apiBaseUrl: 'http://10.0.2.2:5000',

  // Socket.IO server URL (evSocketServer.js — port 5001)
  socketUrl: 'http://10.0.2.2:5001',
};

export default config;
