import { useAuth0 } from "@auth0/auth0-react";
import { Globe, Shield, Users } from "lucide-react";
import React from "react";
import Button from "../UI/Button";

const LoginPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

  // Check for Auth0 error in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  const isDomainNotAllowed = error === 'access_denied' && errorDescription === 'Domain not in allowlist';

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: "google-oauth2",
        prompt: "select_account",
        redirect_uri: window.location.origin,
      },
    });
  };

  const features = [
    {
      icon: Globe,
      title: "Domain Allowlist Management",
      description:
        "Control which domains are allowed to access your Coffee.ai workspace",
    },
    {
      icon: Users,
      title: "User Management",
      description: "Invite, edit, and manage user roles and permissions",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Enterprise-grade security with Google OAuth integration",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl mb-6 mx-auto">
            <img
              src={"coffee-logo-bean-64.png"}
              className="w-16 h-16 rounded-full"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The Coffee Bar
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Internal administration tool for managing domains and users in your workspace
          </p>
        </div>

        {/* <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div> */}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          {isDomainNotAllowed ? (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6 mx-auto">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Domain Not Whitelisted
              </h2>
              <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm mb-3">
                  <strong>Access Denied:</strong> Your email domain is not currently whitelisted for The Coffee Bar admin panel.
                </p>
                <p className="text-red-700 text-sm">
                  Only users with approved email domains can access this application.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Need Access?</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Contact the Coffee.ai team to request domain whitelisting for your organization.
                </p>
                <div className="text-xs text-blue-700">
                  <p className="mb-1">📧 <strong>Email:</strong> support@coffee.ai</p>
                  <p>🏢 <strong>Include:</strong> Your company domain and business justification</p>
                </div>
              </div>

              <div className="flex space-x-3 justify-center">
                <Button 
                  onClick={() => window.location.href = window.location.origin}
                  variant="secondary"
                >
                  Try Different Account
                </Button>
                <Button 
                  onClick={() => window.open('mailto:support@coffee.ai?subject=Domain Whitelist Request&body=Hello Coffee.ai Team,%0A%0AI would like to request domain whitelisting for The Coffee Bar admin panel.%0A%0AMy details:%0A- Email Domain: [Your domain]%0A- Company: [Your company]%0A- Business Justification: [Why you need access]%0A%0AThank you for your consideration.', '_blank')}
                >
                  Contact Support
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Sign in to continue
              </h2>
              <p className="text-gray-600 mb-8">
                Use your Google account to access The Coffee Bar admin panel
              </p>

              <Button onClick={handleLogin} size="lg" className="px-8 py-3">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
            </>
          )}

          {/* <p className="text-xs text-gray-500 mt-6">
            By signing in, you agree to Coffee.ai's terms of service and privacy policy
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;