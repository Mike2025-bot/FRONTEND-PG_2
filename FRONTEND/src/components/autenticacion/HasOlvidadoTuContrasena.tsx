import React, { useState } from 'react';
import './LoginRegistro.css';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="wrapper">
      <div className="login_box">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="login-header forgot-header">
              <span>Forgot Password</span>
            </div>
            <div className="input_box">
              <input
                type="email"
                className="input-field"
                required
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="input_box">
              <input type="submit" className="input-submit" value="Send recovery email" />
            </div>
            <div className="register">
              <span>Remembered your password? <a href="#" onClick={e => {e.preventDefault(); onBackToLogin();}}>Back to login</a></span>
            </div>
          </form>
        ) : (
          <div className="register">
            <h3>Check your email</h3>
            <p>If an account with that email exists, you will receive instructions to reset your password.</p>
            <a href="#" onClick={e => {e.preventDefault(); onBackToLogin();}}>Back to login</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword; 