const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 2 * 60 * 60 * 1000,
};

router.get('/github', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { ...cookieOptions, maxAge: 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.BASE_URL}/api/auth/github/callback`,
    scope: 'read:user',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state || state !== req.cookies.oauth_state) {
      return res.status(400).send('Invalid OAuth state');
    }
    res.clearCookie('oauth_state');

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(401).send('GitHub login failed');

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ai-capsule',
        Accept: 'application/vnd.github+json',
      },
    });
    const ghUser = await userRes.json();
    if (!ghUser.id) return res.status(401).send('Could not read GitHub user');

    // our own application JWT (not the GitHub token)
    const token = jwt.sign(
      { user_id: String(ghUser.id), login: ghUser.login },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '2h' }
    );
    res.cookie('token', token, cookieOptions);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Login error');
  }
});

router.get('/me', auth, (req, res) => {
  res.json({ user_id: req.user.user_id, login: req.user.login });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ ok: true });
});

module.exports = router;