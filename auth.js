const form = document.getElementById('authForm');
const toggleMode = document.getElementById('toggleMode');
const title = document.getElementById('authTitle');
const subtitle = document.getElementById('authSubtitle');
const submitBtn = document.getElementById('submitBtn');
const errorBox = document.getElementById('authError');
const password = document.getElementById('password');
let isRegister = false;

function renderMode() {
    title.textContent = isRegister ? 'Create account' : 'Sign in';
    subtitle.textContent = isRegister ? 'Create your dashboard account.' : 'Access the sentiment analysis dashboard.';
    submitBtn.textContent = isRegister ? 'Create account' : 'Sign in';
    toggleMode.textContent = isRegister ? 'I already have an account' : 'Create an account';
    password.autocomplete = isRegister ? 'new-password' : 'current-password';
    errorBox.textContent = '';
}

toggleMode.addEventListener('click', () => {
    isRegister = !isRegister;
    renderMode();
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    submitBtn.disabled = true;

    try {
        const response = await fetch(isRegister ? '/api/auth/register' : '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                email: document.getElementById('email').value,
                password: password.value
            })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Authentication failed.');
        window.location.replace('/');
    } catch (error) {
        errorBox.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
    }
});

renderMode();
