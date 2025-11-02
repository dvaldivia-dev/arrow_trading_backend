import { Router } from "express";
import {
  getInvoiceList,
  getFullInvoiceList,
  getOriginalInvoicePDF,
  getAttachmentsInvoicePDF,
  getInvoicePDF,
} from "../controllers/invoice.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.post("/invoices", verifyToken, getInvoiceList);
router.post("/invoices/full", verifyToken, getFullInvoiceList);
router.get("/invoices/original/:id", getOriginalInvoicePDF);
router.get("/invoices/attachments/:id", getAttachmentsInvoicePDF);
router.get("/invoices/:id/pdf", getInvoicePDF);

export default router;
