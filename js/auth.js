import { getAuthClient, bookingDestination } from './auth-client.js';

const form = document.getElementById('account-form');
const submit = document.getElementById('account-submit');
const status = document.getElementById('account-status');
const tabs = document.querySelector('.account-tabs');
const email = document.getElementById('account-email');
const fullName = document.getElementById('account-name');
const password = document.getElementById('account-password');
const confirmPassword = document.getElementById('account-confirm');
const resetButton = document.getElementById('account-reset');
const resendButton = document.getElementById('account-resend');
const signedIn = document.getElementById('account-signed-in');
const destination = bookingDestination();
let mode = 'login';
let busy = false;
let client;
let recovering = new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery';

function showStatus(message) {
  status.textContent = message;
  status.hidden = !message;
}

function setMode(nextMode) {
  mode = nextMode;
  const signup = mode === 'signup';
  const recovery = mode === 'recovery';
  const reset = mode === 'reset';
  const labels = {
    login: ['Welcome back', 'Log in to plan your property visit.', 'Log In'],
    signup: ['Create your account', 'Sign up to plan a visit to PV Associates.', 'Create Account'],
    reset: ['Reset your password', 'Enter your email to request a password-reset link.', 'Send Reset Link'],
    recovery: ['Choose a new password', 'Set a new password for your account.', 'Save New Password']
  };
  const [heading, description, action] = labels[mode];
  document.getElementById('account-heading').textContent = heading;
  document.getElementById('account-description').textContent = description;
  submit.textContent = action;
  form.hidden = false;
  signedIn.hidden = true;
  tabs.hidden = recovery;
  document.getElementById('account-name-field').hidden = !signup;
  fullName.disabled = !signup;
  fullName.required = signup;
  document.getElementById('account-email-field').hidden = recovery;
  email.disabled = recovery;
  document.getElementById('account-password-field').hidden = reset;
  password.disabled = reset;
  password.required = !reset;
  password.minLength = signup || recovery ? 8 : 1;
  password.autocomplete = signup || recovery ? 'new-password' : 'current-password';
  document.getElementById('account-confirm-field').hidden = !(signup || recovery);
  confirmPassword.disabled = !(signup || recovery);
  confirmPassword.required = signup || recovery;
  document.getElementById('account-password-hint').hidden = !(signup || recovery);
  password.setAttribute('aria-describedby', 'account-password-hint');
  resetButton.hidden = mode !== 'login';
  resendButton.hidden = mode !== 'login';
  for (const button of tabs.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  password.value = '';
  confirmPassword.value = '';
  password.setCustomValidity('');
  confirmPassword.setCustomValidity('');
  showStatus('');
}

function setBusy(value) {
  busy = value;
  form.setAttribute('aria-busy', String(value));
  for (const button of document.querySelectorAll('button')) button.disabled = value;
}

function showAccount(user) {
  if (!user.email_confirmed_at) return;
  form.hidden = true;
  tabs.hidden = true;
  resetButton.hidden = true;
  resendButton.hidden = true;
  signedIn.hidden = false;
  document.getElementById('account-heading').textContent = 'You are signed in';
  document.getElementById('account-description').textContent = 'Continue to request your property visit.';
  document.getElementById('account-identity').textContent = user.email;
  document.getElementById('account-continue').href = destination.href;
}

const callback = new URL('../auth.html', import.meta.url);
const returnPage = new URL(destination);
returnPage.searchParams.delete('book');
callback.searchParams.set('next', returnPage.pathname.split('/').pop() + returnPage.search + returnPage.hash);

for (const button of tabs.querySelectorAll('button')) {
  button.addEventListener('click', () => {
    if (!busy) setMode(button.dataset.mode);
  });
}
resetButton.addEventListener('click', () => setMode('reset'));
for (const input of [fullName, password, confirmPassword]) input.addEventListener('input', () => input.setCustomValidity(''));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  fullName.setCustomValidity(mode === 'signup' && !fullName.value.trim() ? 'Enter your full name.' : '');
  if (mode === 'signup' || mode === 'recovery') {
    password.setCustomValidity(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value) ? '' : 'Use at least 8 characters with uppercase, lowercase and a number.');
    confirmPassword.setCustomValidity(password.value === confirmPassword.value ? '' : 'Passwords do not match.');
  }
  if (!form.reportValidity()) return;
  setBusy(true);
  showStatus('Please wait…');
  try {
    client = await getAuthClient();
    if (mode === 'signup') {
      const { error } = await client.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: { data: { full_name: fullName.value.trim() }, emailRedirectTo: callback.href }
      });
      if (error) throw error;
      setMode('login');
      showStatus('Check your email for a verification link. Verify your address, then log in to continue. If you already have an account, log in or reset your password.');
    } else if (mode === 'reset') {
      const { error } = await client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: callback.href });
      if (error) throw error;
      showStatus('If an account exists for this email, you will receive a password-reset link. Check your inbox and spam folder.');
    } else if (mode === 'recovery') {
      const { error } = await client.auth.updateUser({ password: password.value });
      if (error) throw error;
      await client.auth.signOut();
      recovering = false;
      setMode('login');
      showStatus('Your password has been updated. Log in with your new password.');
    } else {
      const { error } = await client.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
      if (error) throw error;
      const { data, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!data.user?.email_confirmed_at) throw new Error('Please verify your email before booking.');
      location.assign(destination.href);
    }
  } catch (error) {
    showStatus(error.message || 'Unable to connect. Please try again.');
  } finally {
    password.value = '';
    confirmPassword.value = '';
    setBusy(false);
  }
});

resendButton.addEventListener('click', async () => {
  if (busy) return;
  if (!email.reportValidity()) return;
  setBusy(true);
  try {
    client = await getAuthClient();
    const { error } = await client.auth.resend({ type: 'signup', email: email.value.trim(), options: { emailRedirectTo: callback.href } });
    if (error) throw error;
    showStatus('If verification is needed, a new link will be sent to this email.');
  } catch (error) {
    showStatus(error.message || 'Unable to send a verification email.');
  } finally {
    setBusy(false);
  }
});

document.getElementById('account-signout').addEventListener('click', async () => {
  setBusy(true);
  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    setMode('login');
    showStatus('You have signed out.');
  } catch (error) {
    showStatus(error.message || 'Unable to sign out.');
  } finally {
    setBusy(false);
  }
});

async function initializeAccount() {
  setBusy(true);
  try {
    client = await getAuthClient();
    client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovering = true;
        setMode('recovery');
      }
      if (event === 'SIGNED_OUT') {
        recovering = false;
        setMode('login');
      }
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (recovering) {
      if (!data.session) throw new Error('This reset link has expired. Request a new password-reset email.');
      setMode('recovery');
    } else if (data.session) {
      const { data: verified, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      showAccount(verified.user);
    }
  } catch (error) {
    if (recovering) {
      recovering = false;
      setMode('reset');
    }
    showStatus(error.message || 'Unable to connect. Please try again.');
  } finally {
    setBusy(false);
  }
}
setMode('login');
initializeAccount();
