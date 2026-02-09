import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { userId: string };
  file?: Express.Multer.File;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = { userId: decoded.userId };
    next();
  });
};
