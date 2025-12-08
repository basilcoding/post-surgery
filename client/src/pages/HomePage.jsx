import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  User, 
  Activity, 
  BrainCircuit, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans text-slate-800">
            
            {/* --- Navbar --- */}
            <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center space-x-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        Recovery<span className="text-blue-600">Smart</span>
                    </span>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full">
                        Powered by Gemini AI & Secure Cloud Storage
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900">
                        Surgery <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                            Recovery Management System
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
                        An AI-driven ecosystem bridging the gap between hospital and home. 
                        We ensure continuous monitoring, automated reporting, and instant emergency response 
                        to prevent post-operative complications.
                    </p>
                </div>

                {/* --- Login / Role Selection Cards --- */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24">
                    
                    {/* Doctor Card */}
                    <div 
                        onClick={() => navigate("/doctor-login")}
                        className="group relative bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Stethoscope size={120} className="text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Stethoscope size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Doctor Portal</h3>
                            <p className="text-slate-500 mb-6">
                                Monitor patient vitals, receive automated AI summaries, and manage emergency alerts.
                            </p>
                            <span className="inline-flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                                Access Dashboard &rarr;
                            </span>
                        </div>
                    </div>

                    {/* Patient Card */}
                    <div 
                        onClick={() => navigate("/patient-login")}
                        className="group relative bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <User size={120} className="text-teal-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-6 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                <User size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Patient Portal</h3>
                            <p className="text-slate-500 mb-6">
                                Chat with your AI recovery assistant, track symptoms, and stay connected with your surgeon.
                            </p>
                            <span className="inline-flex items-center text-teal-600 font-semibold group-hover:translate-x-2 transition-transform">
                                Start Recovery &rarr;
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Features Grid --- */}
                <div className="grid md:grid-cols-3 gap-8 text-center border-t border-slate-200 pt-16">
                    <div className="p-4">
                        <div className="mx-auto w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                            <BrainCircuit />
                        </div>
                        <h4 className="text-lg font-bold mb-2">AI Health Chatbot</h4>
                        <p className="text-sm text-slate-500">
                            Powered by Gemini AI to collect symptoms and provide medication reminders 24/7.
                        </p>
                    </div>
                    <div className="p-4">
                        <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-4">
                            <Clock />
                        </div>
                        <h4 className="text-lg font-bold mb-2">Real-time Alerts</h4>
                        <p className="text-sm text-slate-500">
                            Detects emergencies instantly and routes reports to available alternate doctors.
                        </p>
                    </div>
                    <div className="p-4">
                        <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                            <ShieldCheck />
                        </div>
                        <h4 className="text-lg font-bold mb-2">Secure Records</h4>
                        <p className="text-sm text-slate-500">
                            Decentralized storage via Pinata & IPFS ensures your medical data stays private.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default HomePage;