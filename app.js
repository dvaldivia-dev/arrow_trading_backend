import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import invoiceRoutes from "./src/routes/invoice.routes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", invoiceRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
