import pool from "../config/db.js";
import dayjs from "dayjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const _formatDate = (dateInput) => {
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

const _fetchInvoiceById = async (id) => {
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

  // Ejecuta la consulta (asegúrate que 'pool' está definido e importado)
  const [rows] = await pool.query(query, [id]);

  if (rows.length === 0) {
    // Devuelve null si no se encuentra
    return null;
  }

  // Mapeo y formateo de datos
  const invoiceData = rows[0];

  const invoice = {
    id: invoiceData.id,
    num: invoiceData.Num || "",
    issueDate: invoiceData.issueDate,
    S0Num: invoiceData.S0Num || "", // Corregido a 'S0Num' según tu query
    lncotenn: invoiceData.lncotenn || "",
    shipDate: invoiceData.shipDate,
    dueDate: invoiceData.dueDate,
    terms: invoiceData.terms || "",
    method: invoiceData.method || "",
    shipTo: invoiceData.shipTo || "",
    billTo: invoiceData.billTo || "",
    subtotal: Number(invoiceData.subtotal) || 0,
    total: Number(invoiceData.total) || 0,
    productNo: invoiceData.productNo || "",
    itemQty: Number(invoiceData.itemQty) || 0,
    um: invoiceData.um || "",
    description: invoiceData.description || "",
    priceEach: Number(invoiceData.priceEach) || 0,
    priceOriginal: Number(invoiceData.priceOriginal) || 0,
    amount: Number(invoiceData.amount) || 0,
    notes: invoiceData.notes || "",
    attachmentsPath: invoiceData.attachmentsPath || "",
  };

  return invoice;
};

export const getInvoicePDF = async (req, res) => {
  try {
    // 1. Obtener el ID de la factura de los parámetros de la URL
    const { id } = req.params; // Debes obtener el ID aquí también
    if (!id) {
      return res.status(400).json({
        error: "El ID de la factura es requerido para generar el PDF.",
      });
    }
    try {
      const pdfBuffer = await _generateInvoicePDFBuffer(id);
      if (pdfBuffer) {
        // Codificar el Buffer a una cadena Base64
        const base64String = pdfBuffer.toString("base64");
        // Enviar la cadena Base64 al cliente dentro de un objeto JSON
        res.status(200).json({
          invoiceId: id,
          pdfBase64: base64String,
          message:
            "PDF de factura generado y codificado a Base64 correctamente.",
        });
      } else {
        res.status(404).json({ error: "Factura no encontrada." });
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
      res.status(500).json({ error: "No se pudo generar el PDF" });
    }
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).json({ error: "No se pudo generar el PDF" });
  }
};

export const getInvoiceById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "El ID de la factura es requerido." });
  }
  try {
    const invoice = await _fetchInvoiceById(id); // Usa la función auxiliar

    if (invoice) {
      res.status(200).json(invoice);
    } else {
      res
        .status(404)
        .json({ error: "No se encontró la factura con el ID proporcionado." });
    }
  } catch (error) {
    console.error("Error en getInvoiceById:", error);
    // En caso de error de BD o de otro tipo
    res
      .status(500)
      .json({ error: "Error interno del servidor al buscar la factura." });
  }
};

export const updateInvoice = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ error: "El ID de la factura a actualizar es requerido." });
  }

  // 1. Mapear los campos de la solicitud a los nombres de columna de la BD (si son diferentes)
  // Utilizamos este mapa para filtrar y asegurar que solo se actualizan columnas válidas.
  const columnMap = {
    num: "Num",
    S0Num: "S0Num",
    issueDate: "IssueDate",
    shipDate: "ShipDate",
    dueDate: "DueDate",
    billTo: "BillTo",
    shipTo: "ShipTo",
    method: "MethodOfShipment", // 'method' -> 'MethodOfShipment'
    terms: "PaymentTerms", // 'terms' -> 'PaymentTerms'
    notes: "Notes",
    lncotenn: "lncotenn",
    productNo: "ProductNo",
    description: "Description",
    amount: "Amount",
    um: "UM",
    itemQty: "ItemQty",
    priceEach: "PriceEach",
    priceOriginal: "PriceOriginal",
    subtotal: "Subtotal",
    total: "Total",
    attachmentsPath: "AttachmentsPDFPath",
  };
  // Lista de campos que requieren el formateo de fecha
  const dateFields = ["issueDate", "shipDate", "dueDate"];

  const fieldsToUpdate = []; // Almacena 'Columna = ?'
  const values = []; // Almacena los valores correspondientes

  // 2. Construir dinámicamente el SET de la consulta SQL
  for (const key in updates) {
    // Usamos el mapa para obtener el nombre de columna correcto
    const dbColumn = columnMap[key];

    // Verificar que la clave existe en el mapa Y que el valor no es undefined
    if (dbColumn) {
      let value = updates[key];

      // **Aplicar el formateo de fecha si es una columna de fecha**
      if (dateFields.includes(key)) {
        value = formatSQLDateTime(value);
      }

      // Evita actualizar si el valor es nulo/inválido después del formateo, a menos que se quiera nulo explícitamente.
      // Aquí, si formatSQLDateTime retorna null, insertamos null en la BD.

      fieldsToUpdate.push(`${dbColumn} = ?`);
      values.push(value);
    }
  }

  // 3. Verificar si hay algo que actualizar
  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({
      error: "No se proporcionaron campos válidos para actualizar.",
    });
  }

  try {
    console.log(fieldsToUpdate.join(", "));
    // 4. Construir la consulta SQL final
    const setClause = fieldsToUpdate.join(", ");
    const query = `
      UPDATE ATC.Invoices
      SET ${setClause}
      WHERE Id = ?;
    `;

    // 5. Añadir el ID al final de los valores para la cláusula WHERE
    values.push(id);

    // 6. Ejecutar la consulta
    const [result] = await pool.query(query, values);

    // 7. Verificar el resultado
    if (result.affectedRows === 0 && result.changedRows === 0) {
      return res.status(404).json({
        error:
          "Factura no encontrada o no se realizaron cambios (los datos proporcionados son idénticos).",
      });
    }

    // 8. Respuesta exitosa
    res.status(200).json({
      message: `Factura con ID ${id} actualizada correctamente (PATCH).`,
      invoiceId: id,
      updatedFields: Object.keys(updates).filter((key) => columnMap[key]), // Mostrar solo los campos válidos
    });
  } catch (error) {
    console.error("Error al actualizar la factura (PATCH):", error);
    res.status(500).json({
      error: "No se pudo actualizar la factura debido a un error del servidor.",
      details: error.message,
    });
  }
};

const formatSQLDateTime = (isoDateString) => {
  if (!isoDateString) return null; // Retorna null si no hay valor
  const date = new Date(isoDateString);
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) return null;

  // Formatea a YYYY-MM-DD HH:MM:SS (ajusta según la necesidad de la BD y la zona horaria)
  // Usaremos toISOString y limpiaremos la 'T' y la 'Z' para un formato básico compatible
  return date.toISOString().replace("T", " ").substring(0, 19);
};

// Necesitarás las importaciones: fs, path, puppeteer, PDFDocument (de pdf-lib)
const _generateInvoicePDFBuffer = async (invoiceId) => {
  // 1. Obtener la factura. Reutiliza la función auxiliar de la DB
  const invoice = await _fetchInvoiceById(invoiceId); // Asume que _fetchInvoiceById está disponible

  if (!invoice) {
    throw new Error(`Factura con ID ${invoiceId} no encontrada.`);
  }

  const attachmentsPath = invoice.attachmentsPath;

  // 2. Lógica de rellenado de plantilla HTML (misma que en getInvoicePDF)
  // Cargar plantilla
  const templatePath = path.join(__dirname, "../template/invoice.html");
  let html = fs.readFileSync(templatePath, "utf-8");
  const currencyFormat = {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  };

  html = html
    .replace("{{Invoice_No}}", invoice.num)
    .replace("{{Invoice_Date}}", _formatDate(invoice.issueDate))
    .replace("{{SONum}}", invoice.S0Num)
    .replace("{{Incotenn}}", invoice.lncotenn)
    .replace("{{Terms}}", invoice.terms)
    .replace("{{Ship_Date}}", _formatDate(invoice.shipDate))
    .replace("{{Due_Date}}", _formatDate(invoice.dueDate))
    .replace("{{Shipment}}", invoice.method)
    .replace("{{Ship_To}}", invoice.shipTo)
    .replace("{{Bill_To}}", invoice.billTo)
    .replace("{{Product_No}}", invoice.productNo)
    .replace(
      "{{Item_Qty}}",
      invoice.itemQty.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
      })
    )
    .replace("{{UM}}", invoice.um)
    .replace("{{Description}}", invoice.description)
    .replace("{{Transport_No}}", invoice.notes)
    .replace(
      "{{Price_Each}}",
      invoice.priceEach.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 5,
      })
    )
    .replace(
      "{{Amount}}",
      invoice.amount.toLocaleString("es-MX", currencyFormat)
    )
    .replace(
      "{{Subtotal}}",
      invoice.subtotal.toLocaleString("es-MX", currencyFormat)
    )
    .replace(
      "{{Total}}",
      invoice.total.toLocaleString("es-MX", currencyFormat)
    );

  // 3. Generar el PDF principal con Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer1 = await page.pdf({ format: "A4" });
  await browser.close();

  const extraPdfPath = attachmentsPath;

  if (!fs.existsSync(extraPdfPath)) {
    // En lugar de lanzar un error, puedes decidir si continuar o no.
    // Si es crucial, lanza el error. Si es opcional, puedes omitir la fusión.
    // Aquí mantengo el throw como lo tenías:
    throw new Error(`El archivo de adjuntos no existe: ${extraPdfPath}`);
  }

  // Asegúrate de que 'fs' está importado
  const pdfBuffer2 = fs.readFileSync(extraPdfPath);
  const pdf1 = await PDFDocument.load(pdfBuffer1);
  const pdf2 = await PDFDocument.load(pdfBuffer2);

  const mergedPdf = await PDFDocument.create();

  const copiedPages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
  copiedPages1.forEach((p) => mergedPdf.addPage(p));

  const copiedPages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());
  copiedPages2.forEach((p) => mergedPdf.addPage(p));

  const mergedBuffer = await mergedPdf.save();
  return Buffer.from(mergedBuffer);
};

export const getBillToList = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT BillTo FROM Invoices ORDER BY BillTo
    `;

    const [rows] = await pool.query(query);
    const billToList = rows.map((row) => row.BillTo);

    res.json({
      list: billToList,
      result: billToList.length > 0,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getShipToList = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ShipTo FROM Invoices ORDER BY ShipTo
    `;

    const [rows] = await pool.query(query);
    const shipToToList = rows.map((row) => row.ShipTo);
    res.json({
      list: shipToToList,
      result: shipToToList.length > 0,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getIncotermList = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT lncotenn FROM Invoices ORDER BY lncotenn
    `;

    const [rows] = await pool.query(query);
    const lncotennToList = rows.map((row) => row.lncotenn);
    res.json({
      list: lncotennToList,
      result: lncotennToList.length > 0,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const transporter = nodemailer.createTransport({
  // Ejemplo de configuración SMTP de Gmail
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "billing@arrowtradecenter.com", //"",
    pass: "wcAt3j*z", //"swtx xpnu vkem rbmv", , // Usar contraseñas de aplicación/token OAuth
  },
});

export const sendInvoicesEmail = async (req, res) => {
  // 1. Obtener los parámetros del cuerpo de la solicitud
  const { recipientEmails, subject, messageHtml, invoiceIds } = req.body; // Asumiendo que envías estos datos en el cuerpo (POST)

  // Validación básica de entrada
  if (
    !recipientEmails ||
    recipientEmails.length === 0 ||
    !invoiceIds ||
    invoiceIds.length === 0
  ) {
    return res.status(400).json({
      error: "Faltan parámetros requeridos: correos o IDs de facturas.",
    });
  }

  try {
    // 2. Generar todos los PDFs y crear el arreglo de adjuntos
    const attachmentPromises = invoiceIds.map(async (item) => {
      const pdfBuffer = await _generateInvoicePDFBuffer(item.id);

      // Crear el objeto de adjunto para Nodemailer
      // filename: El nombre de archivo que verá el receptor.
      // content: El Buffer binario del PDF.
      return {
        filename: `Invoice_${item.Num}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      };
    });

    // Esperar a que todos los PDFs se generen
    const attachments = await Promise.all(attachmentPromises);

    // 3. Configurar y enviar el correo electrónico
    const mailOptions = {
      from: "Arrow trade center <billing@arrowtradecenter.com>",
      to: recipientEmails.join(", "), // Nodemailer acepta un string separado por comas
      subject: subject,
      html: messageHtml,
      attachments: attachments, // Adjuntar todos los PDFs generados
    };

    const info = await transporter.sendMail(mailOptions);

    // 4. Respuesta exitosa
    res.status(200).json({
      message: "Correo electrónico enviado con éxito.",
      messageId: info.messageId,
      invoicesSent: invoiceIds.length,
      result: true,
    });
  } catch (error) {
    console.error("Error al enviar el correo con PDFs:", error);
    res.status(500).json({
      error: "Fallo al enviar el correo electrónico.",
      details: error.message,
      result: false,
    });
  }
};
