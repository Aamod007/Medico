import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { AddressInput } from "@medico/shared";

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { name, avatar } = req.body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name ? { name } : {}),
      ...(avatar ? { avatar } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
    },
  });

  res.json({ success: true, message: "Profile updated", data: updated });
}

export async function getAddresses(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: "desc" },
  });
  res.json({ success: true, data: addresses });
}

export async function createAddress(req: Request<{}, {}, AddressInput>, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const data = req.body;

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      ...data,
      userId,
    },
  });

  res.status(201).json({ success: true, message: "Address created", data: address });
}

export async function updateAddress(req: Request<{ id: string }, {}, Partial<AddressInput>>, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const addressId = req.params.id;
  const data = req.body;

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    res.status(404).json({ success: false, message: "Address not found" });
    return;
  }

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({
    where: { id: addressId },
    data,
  });

  res.json({ success: true, message: "Address updated", data: updated });
}

export async function deleteAddress(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const addressId = req.params.id;

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    res.status(404).json({ success: false, message: "Address not found" });
    return;
  }

  await prisma.address.delete({ where: { id: addressId } });
  res.json({ success: true, message: "Address deleted" });
}
