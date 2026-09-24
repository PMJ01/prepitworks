import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import prepRouter from "./prep";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(prepRouter);

export default router;
