import { Router } from "express";
import {
  getInvoiceList,
  getFullInvoiceList,
  getOriginalInvoicePDF,
  getAttachmentsInvoicePDF,
  getInvoicePDF,
  getInvoiceById,
  updateInvoice,
  getBillToList,
  getShipToList,
  sendInvoicesEmail,
  getIncotermList,
} from "../controllers/invoice.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.post("/invoices", verifyToken, getInvoiceList);
router.post("/invoices/list", verifyToken, getFullInvoiceList);
router.get("/invoices/original/:id", verifyToken, getOriginalInvoicePDF);
router.get("/invoices/attachments/:id", verifyToken, getAttachmentsInvoicePDF);
router.get("/invoices/:id/pdf", verifyToken, getInvoicePDF);
router.get("/invoices/:id", verifyToken, getInvoiceById);
router.patch("/invoices/:id", verifyToken, updateInvoice);
router.get("/invoices/billto/list", verifyToken, getBillToList);
router.get("/invoices/shipto/list", verifyToken, getShipToList);
router.get("/invoices/lncotenn/list", verifyToken, getIncotermList);
router.post("/invoices/send-email", verifyToken, sendInvoicesEmail);

export default router;
