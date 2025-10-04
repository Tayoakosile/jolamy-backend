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
  token: string,
  secret?: string
): any | JwtPayload => {
  return jwt.verify(token, secret || (process.env.JWT_SECRET as string));
};
