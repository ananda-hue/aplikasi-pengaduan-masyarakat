// File: src/pages/AuthPage.js
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  const switchToRegister = () => setIsFlipped(true);
  const switchToLogin = () => setIsFlipped(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">
      <div className="w-full max-w-5xl perspective">
        <div className={`relative w-full transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute w-full backface-hidden">
            <LoginForm onSwitch={switchToRegister} />
          </div>
          <div className="absolute w-full rotate-y-180 backface-hidden">
            <RegisterForm onSwitch={switchToLogin} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
