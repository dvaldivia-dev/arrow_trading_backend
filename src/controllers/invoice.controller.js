import pool from "../config/db.js";
import dayjs from "dayjs";
import dotenv from "dotenv";

dotenv.config();

export const getInvoiceList = async (req, res) => {
  const { numberOfItems: numItemsStr, offset: offsetStr } = req.body;
  try {
    const offset = parseInt(offsetStr, 10);
    const numberOfItems = parseInt(numItemsStr, 10);

    if (isNaN(offset) || offset < 0) {
      return res.status(400).json({
        message: "El parámetro 'offset' debe ser un número entero no negativo.",
      });
    }
    if (isNaN(numberOfItems) || numberOfItems <= 0) {
      return res.status(400).json({
        message:
          "El parámetro 'numberOfItems' debe ser un número entero positivo.",
      });
    }

    const [rows] = await pool.query(
      `SELECT Id, Consecutivo, Num, S0Num, IssueDate, BillTo, ShipTo, lncotenn, ItemQty, PriceEach, Total
                      FROM ATC.Invoices
                      WHERE !isnull(IssueDate) AND !isnull(BillTo)
                      ORDER BY Consecutivo, IssueDate
                      LIMIT ?, ?`,
      [offset, numberOfItems]
    );

    res.json({ list: rows, result: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
