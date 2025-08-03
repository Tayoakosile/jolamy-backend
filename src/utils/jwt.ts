import jwt, { JwtPayload } from "jsonwebtoken";

export const generateToken = (userId: string, secret: string): string => {
  return jwt.sign(
    { id: userId },
    secret || (process.env.JWT_SECRET as string),
    {
      expiresIn: "7d",
    }
  );
};

export const decodeToken = (
  userId: string,
  secret: string
): string | JwtPayload => {
  return jwt.verify(userId, secret || (process.env.JWT_SECRET as string));
};
