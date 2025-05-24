import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import favicon from '../../assets/favicon.png';
import authImage from '../../assets/auth.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image - Wider and Complete */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${authImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/20" />
        
        {/* Quote Overlay - Bottom positioned */}
        <div className="relative z-10 flex items-end justify-center p-8">
          <div className="max-w-md text-center mb-12">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
              <svg className="w-6 h-6 text-primary mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
              </svg>
              <blockquote className="text-base font-medium text-gray-900 mb-3">
                "The stock market is filled with individuals who know the price of everything, but the value of nothing."
              </blockquote>
              <cite className="text-sm text-gray-600">
                — Philip Fisher
              </cite>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Single Card with Logo and Form */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center p-6 animated-gradient">
        <div className="w-full max-w-md">
          {/* Single Card with 60% Opacity containing everything */}
          <div className="bg-white/60 backdrop-blur-lg shadow-2xl rounded-2xl p-8">
            {/* Branding inside the card */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src={favicon} 
                  alt="Tradle Logo" 
                  className="w-12 h-12 mr-3"
                />
                <h1 className="text-4xl font-bold text-gray-900">Tradle</h1>
              </div>
              <p className="text-gray-700 text-sm font-medium">
                Your intelligent trading companion
              </p>
            </div>

            {/* Form Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-700 text-center text-sm">
                Sign in to continue your trading journey
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white/70 backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white/70 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary-dark transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in to Dashboard'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-700">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
                    Create one now
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Bottom Quote - Mobile Only */}
          <div className="mt-6 lg:hidden">
            <div className="bg-white/60 backdrop-blur-lg p-4 rounded-xl text-center">
              <svg className="w-5 h-5 text-primary mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
              </svg>
              <blockquote className="text-sm font-medium text-gray-900 mb-2">
                "Risk comes from not knowing what you're doing."
              </blockquote>
              <cite className="text-xs text-gray-600">
                — Warren Buffett
              </cite>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
