/**
 * Returns the authenticated GitHub user based on the GITHUB_TOKEN env var,
 * or an anonymous user object when no token is configured.
 */
export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return res.status(200).json({ login: 'user', avatarUrl: '', name: 'User' });
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      return res.status(200).json({ login: 'user', avatarUrl: '', name: 'User' });
    }

    const user = await response.json();
    return res.status(200).json({
      login: user.login,
      avatarUrl: user.avatar_url,
      name: user.name || user.login,
    });
  } catch {
    return res.status(200).json({ login: 'user', avatarUrl: '', name: 'User' });
  }
}
