const Service = require("node-windows").Service;
const path = require("path");

const svc = new Service({
  name: "Arrow Trading Service",
  description: "Servidor backend para el sistema de Arrow trading.",
  script: path.join(__dirname, "app.js"),
});

svc.on("uninstall", function () {
  console.log("Servicio desinstalado.");
  console.log("El servicio existe:", svc.exists);
});

svc.uninstall();
