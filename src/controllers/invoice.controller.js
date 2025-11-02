import pool from "../config/db.js";
import dayjs from "dayjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        Num,
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

export const getInvoicePDF = async (req, res) => {
  try {
    // 1. Obtener el ID de la factura de los parámetros de la URL
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ error: "El ID de la factura es requerido." });
    }

    // 2. Consulta a la base de datos
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
        AttachmentsPDFPath as attachmentsPath
      FROM ATC.Invoices
      WHERE Id = ?;
    `;

    // Ejecuta la consulta
    const [rows] = await pool.query(query, [id]);

    // 3. Verificar si se encontró la factura
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró la factura con el ID proporcionado." });
    }

    // Usar la primera fila para extraer los datos
    const invoiceData = rows[0];
    console.log(invoiceData);

    // **Nota importante sobre el manejo de múltiples productos:**
    // La consulta actual solo devolverá la línea (o el encabezado si Id es la clave principal)
    // que coincida con ese Id. Si una factura tiene **múltiples productos/líneas**,
    // necesitarás otra consulta que use un campo de encabezado común (ej: 'Num')
    // y luego iterar sobre todas las filas para construir la tabla de productos en el HTML.
    // Por ahora, asumiremos que rows[0] contiene los datos necesarios para **un producto** // (siguiendo la lógica de tu código original que usaba Product_Details[0]).

    // 4. Mapeo de datos obtenidos de la BD para la plantilla
    const num = invoiceData.Num || "";
    const Invoice_Date = formatDate(invoiceData.issueDate);
    const SO = invoiceData.S0Num || "";
    const Incotenn = invoiceData.lncotenn || "";
    const Ship_Date = formatDate(invoiceData.shipDate);
    const Due_Date = formatDate(invoiceData.dueDate);
    const Terms = invoiceData.terms || "";
    const Shipment = invoiceData.method || "";
    const ShipTo = invoiceData.shipTo || "";
    const BillTo = invoiceData.billTo || "";
    const Subtotal = invoiceData.subtotal || 0;
    const Total = invoiceData.total || 0;

    const Product_No = invoiceData.productNo || "";
    const Item_Qty = invoiceData.itemQty || 0;
    const UM = invoiceData.um || "";
    const Description = invoiceData.description || "";
    const Price_Each = invoiceData.priceEach || 0;
    const Amount = invoiceData.amount || 0;
    const Transport_No = invoiceData.notes || "";

    const attachmentsPath = invoiceData.attachmentsPath || "";

    // Cargar plantilla
    const templatePath = path.join(__dirname, "../template/invoice.html");
    let html = fs.readFileSync(templatePath, "utf-8");

    const currencyFormat = {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    };

    // 5. Rellenar plantilla HTML con los datos de la BD
    html = html
      .replace("{{Invoice_No}}", num)
      .replace("{{Invoice_Date}}", Invoice_Date)
      .replace("{{SONum}}", SO)
      .replace("{{Incotenn}}", Incotenn)
      .replace("{{Terms}}", Terms)
      .replace("{{Ship_Date}}", Ship_Date)
      .replace("{{Due_Date}}", Due_Date)
      .replace("{{Shipment}}", Shipment)
      .replace("{{Ship_To}}", ShipTo)
      .replace("{{Bill_To}}", BillTo)
      .replace("{{Product_No}}", Product_No)
      .replace(
        "{{Item_Qty}}",
        Item_Qty.toLocaleString("es-MX", {
          minimumFractionDigits: 0,
        })
      )
      .replace("{{UM}}", UM)
      .replace("{{Description}}", Description)
      .replace("{{Transport_No}}", Transport_No)
      .replace(
        "{{Price_Each}}",
        Price_Each.toLocaleString("es-MX", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 5,
        })
      )
      .replace("{{Amount}}", Amount.toLocaleString("es-MX", currencyFormat))
      .replace("{{Subtotal}}", Subtotal.toLocaleString("es-MX", currencyFormat))
      .replace("{{Total}}", Total.toLocaleString("es-MX", currencyFormat));

    // 🔹 6. Generar el primer PDF desde HTML con Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer1 = await page.pdf({ format: "A4" });
    await browser.close();

    // 🔹 7. Cargar el PDF adicional (por ejemplo términos)
    const extraPdfPath = attachmentsPath;

    if (!fs.existsSync(extraPdfPath)) {
      throw new Error(`El archivo de adjuntos no existe: ${extraPdfPath}`);
    }

    const pdfBuffer2 = fs.readFileSync(extraPdfPath);

    // 🔹 8. Combinar ambos PDFs con pdf-lib
    const pdf1 = await PDFDocument.load(pdfBuffer1);
    const pdf2 = await PDFDocument.load(pdfBuffer2);

    const mergedPdf = await PDFDocument.create();

    const copiedPages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
    copiedPages1.forEach((p) => mergedPdf.addPage(p));

    const copiedPages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());
    copiedPages2.forEach((p) => mergedPdf.addPage(p));

    const mergedBuffer = await mergedPdf.save();
    // 🔹 9. Codificar el PDF final a Base64 y enviarlo como JSON
    // Convertir el ArrayBuffer/Uint8Array de pdf-lib a Buffer de Node.js
    const pdfBuffer = Buffer.from(mergedBuffer);

    // Codificar el Buffer a una cadena Base64
    const base64String = pdfBuffer.toString("base64");

    // Enviar la cadena Base64 al cliente dentro de un objeto JSON
    res.status(200).json({
      invoiceId: id,
      pdfBase64: base64String,
      message: "PDF de factura generado y codificado a Base64 correctamente.",
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};

const formatDate = (dateInput) => {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  // Comprueba si la fecha es válida
  if (isNaN(date.getTime())) {
    // Si la fecha es inválida, retorna el valor original o una cadena vacía
    return dateInput;
  }

  // Obtener los componentes y aplicar padding (relleno con cero)
  const year = date.getFullYear().toString().slice(-2);
  // getMonth() es base 0, por eso se suma 1
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${month}/${day}/${year}`;
};
