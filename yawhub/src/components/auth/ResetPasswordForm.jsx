// src/components/auth/ResetPasswordForm.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import ErrorAlert from '../common/ErrorAlert';
import SuccessAlert from '../common/SuccessAlert';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/ResetPassword.css';

const ResetPasswordForm = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token from URL params or query string
  const resetToken = token || new URLSearchParams(location.search).get('token');

  useEffect(() => {
    // Verify token validity on component mount
    const verifyToken = async () => {
      if (!resetToken) {
        setTokenValid(false);
        setError('Invalid or missing reset token. Please request a new password reset.');
        return;
      }

      try {
        await authService.verifyResetToken({ token: resetToken });
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        const errorMessage = err.response?.data?.message || err.message;
        if (errorMessage.includes('expired')) {
          setError('Password reset link has expired. Please request a new one.');
        } else if (errorMessage.includes('invalid')) {
          setError('Invalid reset token. Please request a new password reset.');
        } else {
          setError('Unable to verify reset token. Please try again.');
        }
      }
    };

    verifyToken();
  }, [resetToken]);

  // Password strength checker
  useEffect(() => {
    const password = formData.password;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    setPasswordChecks(checks);
    const strength = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!passwordChecks.uppercase) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    
    if (!passwordChecks.lowercase) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    
    if (!passwordChecks.number) {
      setError('Password must contain at least one number');
      return false;
    }
    
    if (!passwordChecks.special) {
      setError('Password must contain at least one special character (!@#$%^&*)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      await authService.resetPassword({
        token: resetToken,
        password: formData.password
      });
      
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      
      if (errorMessage.includes('expired')) {
        setError('Reset link has expired. Please request a new password reset.');
      } else if (errorMessage.includes('invalid')) {
        setError('Invalid reset token. Please request a new password reset.');
      } else if (errorMessage.includes('weak password')) {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(errorMessage || 'Password reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    switch(passwordStrength) {
      case 0:
      case 1:
        return { text: 'Very Weak', color: '#ef4444' };
      case 2:
        return { text: 'Weak', color: '#f59e0b' };
      case 3:
        return { text: 'Medium', color: '#f59e0b' };
      case 4:
        return { text: 'Strong', color: '#10b981' };
      case 5:
        return { text: 'Very Strong', color: '#10b981' };
      default:
        return { text: '', color: '#cbd5e1' };
    }
  };

  const strengthInfo = getPasswordStrengthText();

  if (!tokenValid && !loading) {
    return (
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <div className="auth-badge">Error</div>
          <h2 className="auth-title">Invalid Reset Link</h2>
        </div>
        <ErrorAlert message={error} onClose={() => setError('')} />
        <div className="form-footer">
          <Link to="/forgot-password" className="submit-btn" style={{ textAlign: 'center' }}>
            Request New Reset Link
          </Link>
          <Link to="/login" className="back-link">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-wrapper">
      <div className="auth-header">
        <div className="auth-badge">Create New Password</div>
        <h2 className="auth-title">Reset Your Password</h2>
        <p className="auth-subtitle">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <ErrorAlert message={error} onClose={() => setError('')} />
        <SuccessAlert message={success} onClose={() => setSuccess('')} />
        
        <div className="form-group">
          <label htmlFor="password">
            New Password
            <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter new password"
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Password strength meter */}
          {formData.password && (
            <div className="password-strength">
              <div className="strength-meter">
                <div 
                  className="strength-fill" 
                  style={{ 
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: strengthInfo.color
                  }}
                />
              </div>
              <span style={{ color: strengthInfo.color }}>{strengthInfo.text}</span>
            </div>
          )}
          
          <div className="password-requirements">
            <p>Password must contain:</p>
            <ul>
              <li className={passwordChecks.length ? 'valid' : 'invalid'}>✓ At least 8 characters</li>
              <li className={passwordChecks.uppercase ? 'valid' : 'invalid'}>✓ One uppercase letter</li>
              <li className={passwordChecks.lowercase ? 'valid' : 'invalid'}>✓ One lowercase letter</li>
              <li className={passwordChecks.number ? 'valid' : 'invalid'}>✓ One number</li>
              <li className={passwordChecks.special ? 'valid' : 'invalid'}>✓ One special character (!@#$%^&*)</li>
            </ul>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">
            Confirm New Password
            <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm new password"
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? <LoadingSpinner size="small" text="" /> : 'Reset Password'}
        </button>
        
        <div className="form-footer">
          <Link to="/login" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;