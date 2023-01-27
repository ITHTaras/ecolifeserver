import express, { Request, Response } from "express";
import { PrismaClient } from "prisma/prisma-client";

const router = express.Router();
const prisma = new PrismaClient();

// Create category
router.post("/", async (req: Request, res: Response) => {
  const { name, description } = req.body;
  console.log(req.headers);

  const category = await prisma.category.create({
    data: {
      name: name,
      description: description,
    },
  });

  res.json(category);
});

router.get("/", async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
    take: 6,
  });

  const points = await prisma.point.findMany({
    //where: { isSafe: true },
    include: {
      point_types: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          createdAt: true,
          complaints: {
            select: {
              id: true,
              pointId: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  res.json({ categories, points });
});

// Update
router.put("/:id", async (req: Request, res: Response) => {
  const categoryId = req.params.id;

  const { name, description } = req.body;

  const category = await prisma.category.update({
    where: {
      id: parseInt(categoryId),
    },
    data: {
      name: name,
      description: description,
    },
  });

  res.json(category);
});

// Delete
router.delete("/:id", async (req: Request, res: Response) => {
  const categoryId = req.params.id;

  const category = await prisma.category.delete({
    where: {
      id: parseInt(categoryId),
    },
  });

  res.json(category);
});

module.exports = router;
