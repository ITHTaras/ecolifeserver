import express, { Request, Response } from "express";
import { PrismaClient } from "prisma/prisma-client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post("/", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const userExists = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (userExists) {
    res.json({ message: "Користувач з такою адресою вже існує." });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hash,
    },
  });

  if (user) {
    res.json({
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: "Невірні дані!" });
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      name: user.name,
      email: user.email,
      image: user.image,
      token: generateToken(user.id),
    });
  } else {
    console.log("halo ma boi");

    res.json({ message: "Невірні дані!" });
  }
});

// Edit Profile
router.put("/", async (req: Request, res: Response) => {
  let token;
  const { email, name, password, image } = req.body;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    if (decoded.id) {
      const updateUser = await prisma.user.update({
        where: {
          id: decoded.id,
        },
        data:
          password && image
            ? {
                email,
                name,
                password: hash,
                image,
              }
            : password && !image
            ? { email, name, password: hash }
            : image && !password
            ? { email, name, image }
            : { email, name },
        select: {
          email: true,
          name: true,
          image: true,
        },
      });
      res.json(updateUser);
    } else {
      res.json({ message: "wrong token" });
    }
  } else {
    res.json({ message: "no token" });
  }
});

// Admin Login
router.post("/admin/login", async (req: Request, res: Response) => {
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

    const { password } = req.body;

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
      res.json({ password: password + "_vnlvor" });
    }
  } else {
    res.json({ message: "no token" });
  }
});

module.exports = router;
