import { Router } from "express";
import { getInvoiceList } from "../controllers/invoice.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.post("/invoices", verifyToken, getInvoiceList);

export default router;