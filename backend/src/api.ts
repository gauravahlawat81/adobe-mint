import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { config } from './config';
import { createSubmission, getSubmissions, getStats } from './db';

export const apiRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.replace('Bearer ', '');
  if (!bearer) return res.status(401).json({ error: 'No token' });
  try {
    (req as any).user = jwt.verify(bearer, config.jwt.secret) as any;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/submissions
apiRouter.get('/submissions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    res.json(await getSubmissions(userId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats
apiRouter.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    res.json(await getStats(userId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/submissions
apiRouter.post('/submissions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const { title, description, keywords, category, thumbnail_uri, requires_review, review_reason } = req.body;

    if (!title || !keywords || !category) {
      return res.status(400).json({ error: 'title, keywords, and category are required' });
    }

    // 'submitted' = queued for direct Adobe Stock upload (no human in the loop)
    // 'reviewing' = flagged by AI, needs human approval before going to Adobe Stock
    const status = requires_review ? 'reviewing' : 'submitted';
    const sub = {
      id: uuid(),
      user_id: userId,
      title,
      description: description ?? '',
      keywords,
      category,
      status,
      thumbnail_uri: thumbnail_uri ?? null,
      requires_review: !!requires_review,
      review_reason: review_reason ?? null,
    };

    await createSubmission(sub);
    res.status(201).json({ id: sub.id, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
