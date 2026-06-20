import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Routes imports
import authRouter from './server/routes/auth.ts';
import injectRouter from './server/routes/inject.ts';
import historyRouter from './server/routes/history.ts';
import usersRouter from './server/routes/users.ts';
import settingsRouter from './server/routes/settings.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request parsing with standard limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS and secure headers helper
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Looser CORS for preview iframe purposes
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 10. API Route Handlers
  app.use('/api/auth', authRouter);
  app.use('/api/inject', injectRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/settings', settingsRouter);

  // Health and general API checking
  app.get('/api/health', (req, res) => {
    res.json({ status: 'active', timestamp: new Date().toISOString() });
  });

  // Vite development or production serving mapping
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite dev server middleware on port', PORT);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static build from dist folder...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Fullstack App running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal dev server initiation failure:', err);
});
