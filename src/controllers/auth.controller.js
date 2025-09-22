import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import dotenv from "dotenv";

dotenv.config();

export const register = async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [rows] = await pool.query(
      "INSERT INTO syusers (Username, Password, Full_Name, Status, Type) VALUES (?, ?,  ?, ?, ?)",
      [username, hashedPassword, username, 1, "admin"]
    );
    res.json({ message: "Usuario registrado", userId: rows.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM syusers WHERE Username = ?",
      [username]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.Password);
    if (!validPassword)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, expiresAt: dayjs().add(8, "hour").toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
