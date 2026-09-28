require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { initSocket } = require("./src/lib/socket");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO Real-Time Server
initSocket(server);

server.listen(PORT, () => {
  console.log(`FinGuard server is running on http://localhost:${PORT}`);
});