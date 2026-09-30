import { Router, Request, Response } from "express";
import prisma from "../../lib/prisma";
import { authenticate } from "../../middlewares/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json({ success: true, data: notifications });
});

router.patch("/:id/read", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  res.json({ success: true, message: "Marked as read" });
});

router.patch("/read-all", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
