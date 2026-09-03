import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HomeIcon, EyeIcon, EyeOffIcon, ShieldIcon, CheckIcon } from '../components/icons';

function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      setLocalError(err.message || 'Could not create your account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth page-fade">
      <div className="auth-visual">
        <img src="assets/register.jpg" alt="A serene modern home interior" />
        <div className="auth-visual-scrim" />
        <div className="auth-visual-content">
          <p className="auth-quote">“A house is made of walls and beams; a home is made of love and dreams.”</p>
          <span className="auth-visual-credit">HouseHunt</span>
        </div>
      </div>

      <div className="auth-card">
        <span className="auth-logo">
          <span className="nav-logo-mark"><HomeIcon size={18} /></span>
          HouseHunt
        </span>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start saving homes, making bookings, and more.</p>

        {localError && (
          <div className="auth-alert" role="alert">
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="field">
              <label className="field-label" htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                className="field-input"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                className="field-input"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className="field-input"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="input-action">
              <input
                id="password"
                name="password"
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
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

          <div className="field">
            <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              className="field-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn--gold btn--lg btn--block auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <div className="auth-benefits">
          <span className="auth-benefit"><ShieldIcon size={15} /> Private by default</span>
          <span className="auth-benefit"><CheckIcon size={15} /> Free to join</span>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;