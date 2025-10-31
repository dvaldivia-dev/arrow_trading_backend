import pool from "../config/db.js";
import dayjs from "dayjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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
        Id as id,
        Num as invoiceNo,
        S0Num,
        IssueDate as issueDate,
        BillTo as billTo,
        ShipTo as shipTo,
        lncotenn, 
        ItemQty as itemQty,
        PriceEach as priceEach,
        Total As total,
        needs_review as needsReview
      FROM ATC.Invoices
      WHERE 
        IssueDate BETWEEN ? AND ?
        AND BillTo IS NOT NULL
      ORDER BY IssueDate DESC
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

export const getFullInvoiceList = async (req, res) => {
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
        Id as id,
        Num,
        S0Num,
        IssueDate as issueDate,
        ShipDate as shipDate,
        DueDate as dueDate,
        BillTo as billTo,
        ShipTo as shipTo,
        MethodOfShipment as method,
        PaymentTerms as terms,
        Notes as notes,
        lncotenn,
        ProductNo as productNo,
        Description as description,
        Amount as amount,
        UM as um,
        ItemQty as itemQty,
        PriceEach as priceEach,
        PriceOriginal as priceOriginal,
        Subtotal as subtotal,
        Total as total,
        needs_review as needsReview
      FROM ATC.Invoices
      WHERE 
        IssueDate BETWEEN ? AND ?
        AND BillTo IS NOT NULL
      ORDER BY IssueDate DESC
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

export const getOriginalInvoicePDF = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT OriginalPDFPath FROM Invoices WHERE Id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada." });
    }

    const filePath = rows[0].OriginalPDFPath;

    if (!filePath) {
      return res
        .status(404)
        .json({ message: "La factura no tiene un PDF original asociado." });
    }

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const base64String = fileBuffer.toString("base64");
      res.json({ pdfBase64: base64String });
    } else {
      res.status(404).json({ message: "Archivo PDF original no encontrado." });
    }
  } catch (error) {
    console.error("Error en getOriginalInvoicePDF:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAttachmentsInvoicePDF = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT AttachmentsPDFPath FROM Invoices WHERE Id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Factura no encontrada." });
    }

    const filePath = rows[0].AttachmentsPDFPath;

    if (!filePath) {
      return res
        .status(404)
        .json({ message: "La factura no tiene un PDF de adjuntos asociado." });
    }

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const base64String = fileBuffer.toString("base64");
      res.json({ pdfBase64: base64String });
    } else {
      res
        .status(404)
        .json({ message: "Archivo PDF de adjuntos no encontrado." });
    }
  } catch (error) {
    console.error("Error en getAttachmentsInvoicePDF:", error);
    res.status(500).json({ error: error.message });
  }
};
