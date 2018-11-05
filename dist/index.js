"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");
const child_process_1 = require("child_process");
const XMX = "2G";
const XMS = "2G";
const MINECRAFT_SERVER_JAR_PATH = "server.jar";
const SERVER_PATH = "./";
const PORT = 5555;
const MAX_MESSAGE_COUNT = 200;
const allClients = [];
let allMessages = [];
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
    client.on("console-in", (command) => {
        execute(command);
    });
    client.once("disconnect", () => {
        const index = allClients.indexOf(client);
        if (index > -1)
            allClients.splice(index, 1);
    });
    allClients.push(client);
});
const start = () => {
    child = child_process_1.spawn("java", [
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
const collectMessage = (message) => {
    allMessages.push(message);
    const from = Math.max(allMessages.length - MAX_MESSAGE_COUNT, 0);
    const to = Math.max(Math.max(allMessages.length, 0), MAX_MESSAGE_COUNT);
    allMessages = allMessages.slice(from, to);
    sendToAll(allClients, message);
};
const sendAll = (client, messages) => {
    for (const message of messages) {
        send(client, message);
    }
};
const send = (client, message) => {
    client.emit("console-out", message);
};
const sendToAll = (clients, message) => {
    for (const client of clients) {
        send(client, message);
    }
};
const execute = (command) => {
    collectMessage({ type: "info", message: command });
    if (!child)
        return collectMessage({ type: "error", message: "server has stopped!" });
    child.stdin.write(command + "\n");
};
//# sourceMappingURL=index.js.map