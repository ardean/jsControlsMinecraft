import * as path from "path";
import * as express from "express";
import * as socketIO from "socket.io";
import { spawn } from "child_process";
import Message from "./Message";

const XMX = "2G";
const XMS = "2G";
const MINECRAFT_SERVER_JAR_PATH = "server.jar";
const SERVER_PATH = "./";
const PORT = 5555;

const allClients = [];
const allMessages: Message[] = [];
let child;

const app = express();
app.disable("x-powered-by");
app.use(express.static(__dirname + "/../public"));

const socket = app.listen(PORT, async () => {
  await start();

  console.log("jsControlsMinecraft is listening on port " + PORT);
});

const io = socketIO(socket, {
  path: path.join("/", "/sockets")
});

io.on("connect", client => {
  sendToAll(allClients, { type: "info", message: `client ${client.handshake.address} connected` });

  sendAll(client, allMessages);

  client.on("console-in", (command: string) => {
    execute(command);
  });

  client.once("disconnect", () => {
    const index = allClients.indexOf(client);
    if (index > -1) allClients.splice(index, 1);
  });

  allClients.push(client);
});

const start = () => {
  child = spawn("java", [
    "-Xmx" + XMX,
    "-Xms" + XMS,
    "-jar", MINECRAFT_SERVER_JAR_PATH,
    "nogui"
  ], { cwd: SERVER_PATH });

  child.on("exit", () => {
    collectMessage({ type: "warning", message: "console stopped!" });
    child = null;
  });

  child.stdout.on("data", message => {
    collectMessage({
      type: "info",
      message: message.toString()
    });
  });

  child.stderr.on("data", err => {
    collectMessage({
      type: "error",
      message: err.toString()
    });
  });
};

const collectMessage = (message: Message) => {
  allMessages.push(message);
  sendToAll(allClients, message);
};

const sendAll = (client, messages: Message[]) => {
  for (const message of messages) {
    send(client, message);
  }
};

const send = (client, message: Message) => {
  client.emit("console-out", message);
};

const sendToAll = (clients, message: Message) => {
  for (const client of clients) {
    send(client, message);
  }
};

const execute = (command: string) => {
  collectMessage({ type: "info", message: command });
  if (!child) return collectMessage({ type: "error", message: "server has stopped!" });

  child.stdin.write(command + "\n");
};