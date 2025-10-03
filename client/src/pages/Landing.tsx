import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Users, Settings, LogIn } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const { data: companyData } = useQuery<{ companyName: string }>({
    queryKey: ["/api/public/company-name"],
  });

  const companyName = companyData?.companyName || "MOLLA INDUSTRIES";

  useEffect(() => {
    document.title = `${companyName} - Invoice Generator`;
  }, [companyName]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent" data-testid="text-app-title">
            {companyName}
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300" data-testid="text-app-subtitle">
            Professional Invoice Management System
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 my-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg" data-testid="card-feature-invoices">
            <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Invoice Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Create, edit, and track invoices with ease</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg" data-testid="card-feature-clients">
            <Users className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Client Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">Manage your clients and their information</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg" data-testid="card-feature-pdf">
            <Settings className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">PDF Generation</h3>
            <p className="text-gray-600 dark:text-gray-400">Export professional invoices as PDF</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            size="lg"
            className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            data-testid="button-login"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign In with Google
          </Button>
          <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-secure-notice">
            Secure authentication powered by OAuth
          </p>
        </div>
      </div>
    </div>
  );
}
