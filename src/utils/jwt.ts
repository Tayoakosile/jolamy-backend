import jwt, { JwtPayload } from "jsonwebtoken";

export const generateToken = (user_id: string, secret?: string): string => {
  return jwt.sign(
    { id: user_id },
    secret || (process.env.JWT_SECRET as string),
    {
      expiresIn: "7d",
    }
  );
};

export const decodeToken = (
  user_id: string,
  secret: string
): string | JwtPayload => {
  return jwt.verify(user_id, secret || (process.env.JWT_SECRET as string));
};
