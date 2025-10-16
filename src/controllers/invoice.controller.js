import pool from "../config/db.js";
import dayjs from "dayjs";
import dotenv from "dotenv";

dotenv.config();

export const getInvoiceList = async (req, res) => {
  const { startDate, endDate, numberOfItems, offset } = req.body;

  try {
    // Validaciones básicas
    const parsedOffset = parseInt(offset, 10) || 0;
    const parsedLimit = parseInt(numberOfItems, 10) || 30;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message:
          "Debes proporcionar 'startDate' y 'endDate' en el cuerpo de la solicitud.",
      });
    }

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: "El parámetro 'limit' debe ser un número entero positivo.",
      });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: "El parámetro 'offset' debe ser un número entero no negativo.",
      });
    }

    // Consulta dinámica con conversión de fecha y filtrado
    const query = `
      SELECT 
        Id,
        Consecutivo,
        Num,
        S0Num,
        STR_TO_DATE(IssueDate, '%m/%d/%Y') AS IssueDate,
        BillTo,
        ShipTo,
        lncotenn, 
        ItemQty,
        PriceEach,
        Total
      FROM ATC.Invoices
      WHERE 
        STR_TO_DATE(IssueDate, '%m/%d/%Y') BETWEEN ? AND ?
        AND BillTo IS NOT NULL
      ORDER BY STR_TO_DATE(IssueDate, '%m/%d/%Y') DESC
      LIMIT ?, ?;
    `;

    const [rows] = await pool.query(query, [
      startDate,
      endDate,
      parsedOffset,
      parsedLimit,
    ]);

    res.json({
      list: rows,
      result: rows.length > 0,
      total: rows.length,
    });
  } catch (error) {
    console.error("Error en getInvoiceList:", error);
    res.status(500).json({ error: error.message });
  }
};
