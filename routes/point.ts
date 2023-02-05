import express, { Request, Response } from "express";
import { PrismaClient } from "prisma/prisma-client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mailjet from "node-mailjet";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

// Create point
router.post("/", async (req: Request, res: Response) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    const { latitude, longtitude, categories, image } = req.body;
    console.log(req.body);

    token = req.headers.authorization.split(" ")[1];
    // console.log(token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id) {
      const pointExists = await prisma.point.findFirst({
        where: {
          latitude: latitude,
          longtitude: longtitude,
        },
      });

      if (!pointExists) {
        const point = await prisma.point.create({
          data: {
            latitude: latitude,
            longtitude: longtitude,
            image: image,
            isSafe: false,
            user: {
              connect: {
                id: decoded.id,
              },
            },
            point_types: {
              createMany: {
                data: categories,
              },
            },
          },
          include: {
            point_types: true,
            user: {
              select: {
                id: true,
                createdAt: true,
                email: true,
                name: true,
                image: true,
              },
            },
          },
        });

        res.json(point);
      } else {
        res.json({ message: "Така точка вже існує!" });
      }
    }
  } else {
    res.json({ message: "Not authorized" });
    return;
  }
  if (!token) {
    res.json({ message: "No token" });
  }
});

// Complain
router.post("/complain", async (req: Request, res: Response) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      res.json("Yo ma boi pasted a token huh?");
      return;
    }

    const { email, name, subject, text, pointId } = req.body;

    const now = new Date();
    const complaintExists = await prisma.complaint.findFirst({
      where: {
        userId: decoded.id,
      },
    });

    let daysDiff;
    if (complaintExists) {
      const complaintTime = complaintExists.updatedAt.getTime();
      daysDiff = Math.ceil(
        Math.abs(complaintTime - now.getTime()) / (1000 * 3600 * 24)
      );
    }

    if (!complaintExists || daysDiff >= 30) {
      const complaint = await prisma.complaint.create({
        data: {
          point: {
            connect: {
              id: pointId,
            },
          },
          user: {
            connect: {
              id: decoded.id,
            },
          },
        },
      });
      // Send Email
      const mailjetConn = mailjet.apiConnect(
        process.env.MAILJET_KEY,
        process.env.MAILJET_SECRET
      );
      const request = mailjetConn.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: process.env.ADMIN_EMAIL,
              Name: "Taras",
            },
            To: [
              {
                Email: process.env.ADMIN_EMAIL,
                Name: "Taras",
              },
            ],
            Subject: "Скарга",
            TextPart: "Скарга",
            HTMLPart: `<h3>Повідомлення про скаргу</h3><br /><h4>${name}[${email}], користувач додатку Ecolife поскаржився на пункт з ідентифікатором ${pointId}.</h4><h4>Проблема: ${subject}</h4><h4>Додаткова інформація:</h4><p>${text}</p>`,
            CustomID: "Complain",
          },
        ],
      });
      request
        .then((result) => {
          // OK
        })
        .catch((err) => {
          console.log(err.statusCode);
        });

      res.json(complaint);
    } else {
      res.json({ message: 30 - daysDiff });
    }
  } else {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  if (!token) {
    res.json({ message: "No token" });
  }
});

// Activate point
router.post("/activate", async (req: Request, res: Response) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      res.json("Yo ma boi pasted a token huh?");
      return;
    }

    const { pointId, isSafe, password } = req.body;

    const admin = await prisma.user.findUnique({
      where: {
        email: "hornictaras@gmail.com",
      },
    });

    if (
      admin.name === "Admin" &&
      admin.isAdmin &&
      admin.id === decoded.id &&
      (await bcrypt.compare(password, admin.password))
    ) {
      const activatedPoint = await prisma.point.update({
        data: {
          isSafe: isSafe,
        },
        where: {
          id: pointId,
        },
      });
      console.log(activatedPoint);

      res.json(activatedPoint);
    } else {
      res.json({ message: "Failed to authorize" });
    }
  } else {
    res.json({ message: "no token" });
  }
});

module.exports = router;
