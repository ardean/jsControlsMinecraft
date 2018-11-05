window.addEventListener("load", () => {
  const socket = io(location.host, {
    path: location.pathname + "sockets"
  });

  const commandElement = document.getElementById("command");
  const consoleElement = document.getElementById("console");

  socket
    .on("connect", () => {
      commandElement.addEventListener("keydown", (e) => {
        if (e.keyCode == 13) {
          socket.emit("console-in", commandElement.value);
          commandElement.value = "";
        }
      });

      consoleElement.focus();
    })
    .on("console-out", (data) => {
      const lines = data.message.split("\n");

      for (const line of lines) {
        data.type === "error" ? appendError(line) :
          data.type === "warning" ? appendWarning(line) :
            appendLine(line);
      }
    });

  const appendLine = (message) => {
    const lineElement = document.createElement("div");
    lineElement.textContent = message;
    lineElement.classList.add("line");
    consoleElement.appendChild(lineElement);
    consoleElement.scrollTop = consoleElement.scrollHeight;
    return lineElement;
  }

  const appendWarning = (message) => {
    const lineElement = appendLine(message);
    lineElement.classList.add("warning");
  };

  const appendError = (message) => {
    const lineElement = appendLine(message);
    lineElement.classList.add("error");
  };
});