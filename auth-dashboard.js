(async () => {
    const originalFetch = window.fetch.bind(window);

    // The existing app requests a remote JSON dataset. Route that request through
    // our authenticated API instead, so the browser never bypasses the JWT gate.
    window.fetch = (input, init = {}) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url && url.includes('ppl-ai-code-interpreter-files.s3.amazonaws.com')) {
            return originalFetch('/api/sentiment', { ...init, credentials: 'same-origin' });
        }
        return originalFetch(input, { ...init, credentials: 'same-origin' });
    };

    try {
        const response = await originalFetch('/api/auth/me', { credentials: 'same-origin' });
        if (!response.ok) {
            window.location.replace('/login.html');
            return;
        }

        const { user } = await response.json();
        const authBar = document.getElementById('authBar');
        if (authBar) {
            const label = document.createElement('span');
            label.textContent = user.email;
            label.style.color = 'white';
            const button = document.createElement('button');
            button.className = 'btn btn--outline';
            button.textContent = 'Log out';
            button.addEventListener('click', async () => {
                await originalFetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
                window.location.replace('/login.html');
            });
            authBar.append(label, button);
        }
    } catch {
        window.location.replace('/login.html');
    }
})();
