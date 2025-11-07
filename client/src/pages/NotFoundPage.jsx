// NotFoundPage.jsx
import { Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-6 text-center">
            <div className="max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-error/10">
                        <AlertTriangle className="w-10 h-10 text-error" />
                    </div>
                </div>

                <h1 className="text-5xl font-bold mb-2">404</h1>
                <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
                <p className="text-base-content/70 mb-8">
                    The page you're looking for doesn't exist or may have been moved.
                    Please check the URL or return to the home page.
                </p>

                <Link to="/" className="btn btn-primary gap-2">
                    <Home className="w-5 h-5" />
                    Back to Home
                </Link>
            </div>

            <footer className="mt-10 text-xs text-base-content/60">
                <p>&copy; {new Date().getFullYear()} Surgery Recovery Management System</p>
            </footer>
        </div>
    );
};

export default NotFoundPage;
