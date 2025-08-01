import { Request, Response } from "express";
import User from "../models/User";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await User.create({ name, email });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: "User creation failed" });
  }
};

export const getUsers = async (_: Request, res: Response) => {
  res.json("yooo");
};
