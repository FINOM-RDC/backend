"use strict";

module.exports = () => {
  const io = require("socket.io")(strapi.server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  io.on("connection", function (socket) {
    socket.on("mission-order-targeted", (treatment, missionOrderId) => {
      console.log("mission targeted");
      io.emit("mission-order-targeted", { treatment, missionOrderId });
    });

    socket.on("sum-state-targeted", (treatment, sumStateId) => {
      console.log("sum targeted");
      io.emit("sum-state-targeted", { treatment, sumStateId });
    });
  });
};
