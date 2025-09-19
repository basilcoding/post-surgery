import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-6">
            <h1 className="text-3xl font-bold">Welcome to Hospital Management System!</h1>
            <p className="text-gray-600 text-lg">
                Choose your login type to continue
            </p>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <button
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => navigate("/admin")}
                >
                    Admin Login
                </button>

                <button
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => navigate("/login")}
                >
                    Doctor Login
                </button>

                <button
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={() => navigate("/login")}
                >
                    Patient Login
                </button>
            </div>
        </div>
    );
};

export default HomePage;
