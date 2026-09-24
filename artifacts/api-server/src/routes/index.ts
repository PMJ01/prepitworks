import { Router, type IRouter } from "express";
import healthRouter from "./health";
import prepRouter from "./prep";

const router: IRouter = Router();

router.use(healthRouter);
router.use(prepRouter);

export default router;
