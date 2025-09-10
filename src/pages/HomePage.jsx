import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Calendar, Menu, Star, Users, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  // Redirect authenticated users to their appropriate dashboard
  React.useEffect(() => {
    let mounted = true;
    
    if (isAuthenticated && mounted) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'superadmin') {
        navigate('/super-admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, role, navigate]);

  // Don't render homepage content if user is authenticated (they'll be redirected)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-orange-400" />
              <span className="text-lg md:text-2xl font-bold text-white">RestaurantAI</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link
                to="/login"
                className="px-3 py-2 md:px-6 md:py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 text-sm md:text-base"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-3 py-2 md:px-6 md:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg text-sm md:text-base"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Experience
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent"> Dining</span>
            <br />Redefined
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover exceptional restaurants, book tables instantly, and enjoy AI-powered personalized dining experiences
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">Book a Table</span>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
            >
              <Menu className="w-5 h-5" />
              <span className="font-semibold">Explore Our Menu</span>
            </Link>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="hidden md:block absolute top-20 left-10 bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-float">
            <div className="flex items-center space-x-2 text-white">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold">4.8 Rating</span>
            </div>
          </div>
          <div className="hidden md:block absolute top-40 right-20 bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-float" style={{ animationDelay: '1s' }}>
            <div className="flex items-center space-x-2 text-white">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="font-semibold">50K+ Customers</span>
            </div>
          </div>
          <div className="hidden md:block absolute bottom-40 left-20 bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-float" style={{ animationDelay: '2s' }}>
            <div className="flex items-center space-x-2 text-white">
              <ChefHat className="w-5 h-5 text-orange-400" />
              <span className="font-semibold">50+ Restaurants</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">Why Choose RestaurantAI?</h2>
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of dining with our AI-powered platform that makes every meal memorable
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Calendar,
                title: "Smart Booking",
                description: "Book tables instantly with our intelligent reservation system that learns your preferences"
              },
              {
                icon: ChefHat,
                title: "AI Recommendations",
                description: "Get personalized menu suggestions based on your taste preferences and dietary needs"
              },
              {
                icon: Star,
                title: "Premium Experience",
                description: "Enjoy exceptional service at carefully curated restaurants with verified reviews"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-8 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Dine Better?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of food lovers who trust RestaurantAI for their dining experiences
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="font-semibold">Get Started Today</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <ChefHat className="h-6 w-6 text-orange-400" />
              <span className="text-lg font-semibold text-white">RestaurantAI</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-300">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Downtown Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 RestaurantAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;