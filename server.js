const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const PUBLIC_FILES = new Set(['/login.html', '/auth.js', '/style.css']);

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set and contain at least 32 characters.');
}

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Try again later.' }
});

async function readUsers() {
    try {
        return JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

async function writeUsers(users) {
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 });
}

function signAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m', issuer: 'sentiment-analysis-dashboard', audience: 'dashboard' }
    );
}

function signRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d', issuer: 'sentiment-analysis-dashboard', audience: 'dashboard' }
    );
}

function setAuthCookies(res, user) {
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/'
    };

    res.cookie('access_token', signAccessToken(user), {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
    });
    res.cookie('refresh_token', signRefreshToken(user), {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

function clearAuthCookies(res) {
    res.clearCookie('access_token', { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
}

function authenticateAccess(req, res, next) {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({ error: 'Authentication required.' });

    try {
        const payload = jwt.verify(token, JWT_SECRET, {
            issuer: 'sentiment-analysis-dashboard',
            audience: 'dashboard'
        });
        if (payload.type !== 'access') throw new Error('Wrong token type');
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: 'Session expired.' });
    }
}

app.post('/api/auth/register', authLimiter, async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ error: 'Password must be 8-128 characters.' });
    }

    const users = await readUsers();
    if (users.some(user => user.email === email)) {
        return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const user = {
        id: crypto.randomUUID(),
        email,
        passwordHash: await bcrypt.hash(password, 12),
        createdAt: new Date().toISOString()
    };
    users.push(user);
    await writeUsers(users);
    setAuthCookies(res, user);
    res.status(201).json({ user: { id: user.id, email: user.email } });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const users = await readUsers();
    const user = users.find(item => item.email === email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    setAuthCookies(res, user);
    res.json({ user: { id: user.id, email: user.email } });
});

app.post('/api/auth/refresh', async (req, res) => {
    const token = req.cookies.refresh_token;
    if (!token) return res.status(401).json({ error: 'Refresh token missing.' });

    try {
        const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'sentiment-analysis-dashboard',
            audience: 'dashboard'
        });
        if (payload.type !== 'refresh') throw new Error('Wrong token type');

        const users = await readUsers();
        const user = users.find(item => item.id === payload.sub);
        if (!user) throw new Error('User not found');

        setAuthCookies(res, user);
        res.json({ user: { id: user.id, email: user.email } });
    } catch {
        clearAuthCookies(res);
        res.status(401).json({ error: 'Refresh token expired.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    clearAuthCookies(res);
    res.status(204).end();
});

app.get('/api/auth/me', authenticateAccess, async (req, res) => {
    const users = await readUsers();
    const user = users.find(item => item.id === req.user.sub);
    if (!user) return res.status(401).json({ error: 'User no longer exists.' });
    res.json({ user: { id: user.id, email: user.email } });
});

// The dashboard's current dataset is static sample data. It is served only after JWT auth.
app.get('/api/sentiment', authenticateAccess, async (_req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(path.join(__dirname, 'sentiment_data.json'), 'utf8'));
        res.json(data);
    } catch {
        res.status(500).json({ error: 'Unable to load sentiment data.' });
    }
});

app.get('/login.html', (_req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/auth.js', (_req, res) => res.sendFile(path.join(__dirname, 'auth.js')));

// Protect the dashboard and all static application assets. This keeps unauthenticated users
// from bypassing the login screen by requesting index.html/app.js directly.
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    if (PUBLIC_FILES.has(req.path)) return next();
    return authenticateAccess(req, res, () => express.static(__dirname)(req, res, next));
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`Sentiment dashboard listening on http://localhost:${PORT}`);
});
