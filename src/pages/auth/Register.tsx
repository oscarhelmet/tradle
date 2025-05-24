import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import favicon from '../../assets/favicon.png';
import authImage from '../../assets/auth.png';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initialBalance, setInitialBalance] = useState('10000');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      await register({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        initialBalance: parseFloat(initialBalance),
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
                "An investment in knowledge pays the best interest."
              </blockquote>
              <cite className="text-sm text-gray-600">
                — Benjamin Franklin
              </cite>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Single Card with Logo and Form */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center p-6 animated-gradient">
        <div className="w-full max-w-lg">
          {/* Single Card with 60% Opacity containing everything */}
          <div className="bg-white/60 backdrop-blur-lg shadow-2xl rounded-2xl p-8">
            {/* Branding inside the card */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-3">
                <img 
                  src={favicon} 
                  alt="Tradle Logo" 
                  className="w-10 h-10 mr-3"
                />
                <h1 className="text-3xl font-bold text-gray-900">Tradle</h1>
              </div>
              <p className="text-gray-700 text-sm font-medium">
                Start your trading journey today
              </p>
            </div>

            {/* Form Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
                Create Account
              </h2>
              <p className="text-gray-700 text-center text-sm">
                Join thousands of successful traders
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white/70 backdrop-blur-sm text-sm"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white/70 backdrop-blur-sm text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white/70 backdrop-blur-sm text-sm"
                  placeholder="john@example.com"
                />
              </div>

              {/* Initial Balance */}
              <div>
                <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Balance ($)
                </label>
                <input
                  id="initialBalance"
                  name="initialBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white/70 backdrop-blur-sm text-sm"
                  placeholder="10000"
                />
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white/70 backdrop-blur-sm text-sm"
                  placeholder="Create a strong password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-white/70 backdrop-blur-sm text-sm"
                  placeholder="Confirm your password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-700">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="text-center pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  By creating an account, you agree to our{' '}
                  <button type="button" className="text-primary hover:text-primary-dark underline">
                    Terms of Service
                  </button>
                  and{' '}
                  <button type="button" className="text-primary hover:text-primary-dark underline">
                    Privacy Policy
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
