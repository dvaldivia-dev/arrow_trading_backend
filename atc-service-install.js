const Service = require("node-windows").Service;
const path = require("path");

// Crea un nuevo objeto de Servicio
const svc = new Service({
  name: "Arrow Trading Service", // Nombre del servicio
  description: "Servidor backend para el sistema de Arrow trading.", // Descripción
  script: path.join(__dirname, "app.js"), // Ruta a tu script principal (app.js)
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
});

// Escucha el evento 'install' para iniciar el servicio una vez instalado.
svc.on("install", function () {
  console.log("Servicio instalado correctamente.");
  svc.start();
  console.log("El servicio ha sido iniciado.");
});

svc.install();
