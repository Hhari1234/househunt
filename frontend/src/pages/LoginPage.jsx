import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HomeIcon, EyeIcon, EyeOffIcon, ShieldIcon, CheckIcon } from '../components/icons';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err.message || 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth page-fade">
      <div className="auth-visual">
        <img src="assets/login.jpg" alt="An elegant living space at golden hour" />
        <div className="auth-visual-scrim" />
        <div className="auth-visual-content">
          <p className="auth-quote">“The ache for home lives in all of us.”</p>
          <span className="auth-visual-credit">Maya Angelou</span>
        </div>
      </div>

      <div className="auth-card">
        <span className="auth-logo">
          <span className="nav-logo-mark"><HomeIcon size={18} /></span>
          HouseHunt
        </span>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to continue exploring exceptional homes.</p>

        {localError && (
          <div className="auth-alert" role="alert">
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="field-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="input-action">
              <input
                id="password"
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn--gold btn--lg btn--block auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-alt">
          New to HouseHunt? <Link to="/register">Create an account</Link>
        </p>

        <div className="auth-benefits">
          <span className="auth-benefit"><ShieldIcon size={15} /> Secure sign-in</span>
          <span className="auth-benefit"><CheckIcon size={15} /> Real listings only</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;