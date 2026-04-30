// src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import ErrorAlert from '../common/ErrorAlert';
import SuccessAlert from '../common/SuccessAlert';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/ForgotPasswordForm.css';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Email address is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateEmail()) return;
    
    setLoading(true);

    try {
      // Call backend forgot password endpoint
      const response = await authService.forgotPassword({ email: email.toLowerCase().trim() });
      
      setSuccess(response.message || 'Password reset instructions have been sent to your email. Please check your inbox.');
      setResetSent(true);
      setEmail('');
      
      // Optional: Auto redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      
      // Don't reveal if email exists or not for security
      if (errorMessage.includes('User not found')) {
        // Still show success message for security (don't reveal if email exists)
        setSuccess('If an account exists with this email, you will receive password reset instructions.');
        setResetSent(true);
      } else if (errorMessage.includes('Too many requests')) {
        setError('Too many reset attempts. Please wait 15 minutes before trying again.');
      } else {
        setError(errorMessage || 'Failed to send reset email. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.toLowerCase().trim() });
      setSuccess('Reset instructions resent successfully! Check your email.');
    } catch (err) {
      setError('Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <div className="auth-header">
        <div className="auth-badge">Reset Password</div>
        <h2 className="auth-title">Forgot Password?</h2>
        <p className="auth-subtitle">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <ErrorAlert message={error} onClose={() => setError('')} />
        <SuccessAlert message={success} onClose={() => setSuccess('')} />
        
        {!resetSent ? (
          <>
            <div className="form-group">
              <label htmlFor="email">
                Email Address
                <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-10 7L2 7"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your registered email address"
                  disabled={loading}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              <small className="form-hint">We'll send a password reset link to this email</small>
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <LoadingSpinner size="small" text="" /> : 'Send Reset Instructions'}
            </button>
          </>
        ) : (
          <div className="reset-success-card">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l3 3 6-6"/>
              </svg>
            </div>
            <h3>Check Your Email</h3>
            <p>
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <div className="reset-actions">
              <button 
                type="button" 
                className="resend-btn"
                onClick={handleResendEmail}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="small" text="" /> : 'Resend Email'}
              </button>
              <Link to="/login" className="back-login-btn">
                Back to Login
              </Link>
            </div>
          </div>
        )}
        
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

export default ForgotPasswordForm;