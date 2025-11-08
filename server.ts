import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("message", (msg) => {
      console.log("message: " + msg);
      io.emit("message", msg); // Broadcast message to all connected clients
      io.emit("userCount", io.sockets.sockets.size); 
    });

    socket.on("notice", (notice) => {
      console.log("notice: " + notice);
      io.emit("notice", notice); // Broadcast notice to all connected clients
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
      io.emit("userCount", io.sockets.sockets.size); 
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
