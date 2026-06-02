import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { config } from './config';
import { createSubmission, getSubmissions, getStats, getSubmissionHashes, updateSubmission, deleteSubmission } from './db';

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

// GET /api/submissions/hashes — photo hashes already uploaded by this user
apiRouter.get('/submissions/hashes', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    res.json(await getSubmissionHashes(userId));
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
    const { title, description, keywords, category, thumbnail_uri, requires_review, review_reason, photo_hash } = req.body;

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
      photo_hash: photo_hash ?? null,
    };

    try {
      await createSubmission(sub);
    } catch (e: any) {
      // 23505 = unique_violation → this user already uploaded this exact photo
      if (e.code === '23505') {
        return res.status(409).json({ error: 'duplicate', message: 'This photo has already been uploaded.' });
      }
      throw e;
    }
    res.status(201).json({ id: sub.id, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/submissions/:id — edit metadata on a submission the user owns
apiRouter.patch('/submissions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const { title, description, keywords, category } = req.body;

    if (!title || !keywords || !category) {
      return res.status(400).json({ error: 'title, keywords, and category are required' });
    }

    const ok = await updateSubmission(req.params.id, userId, {
      title,
      description: description ?? '',
      keywords,
      category,
    });
    if (!ok) return res.status(404).json({ error: 'Submission not found' });
    res.json({ id: req.params.id, updated: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/submissions/:id — delete a submission the user owns
apiRouter.delete('/submissions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const ok = await deleteSubmission(req.params.id, userId);
    if (!ok) return res.status(404).json({ error: 'Submission not found' });
    res.json({ id: req.params.id, deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
