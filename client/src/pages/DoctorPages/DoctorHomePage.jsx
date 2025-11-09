import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  User,
  Bell,
  Search,
  BarChart3,
  PlusCircle,
  ChevronDown,
} from "lucide-react";

export default function DoctorHomePage() {
  return (
    <div className="min-h-screen pt-[80px] bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg p-2 bg-white shadow-sm">
              <Home className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Overview</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                className="w-64 pl-9 pr-3 py-2 rounded-lg bg-white shadow-sm text-sm outline-none"
                placeholder="Search patients, surgeries..."
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            </div>

            <button className="p-2 rounded-lg bg-white shadow-sm">
              <Bell className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
              <User className="w-6 h-6" />
              <div className="text-sm text-slate-700">
                <div className="font-medium">Dr. Sameer Verma</div>
                <div className="text-xs text-slate-500">Orthopaedics</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <section className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <h2 className="text-sm font-medium text-slate-600">Quick Summary</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500">Active Patients</div>
                  <div className="text-2xl font-semibold">--</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500">Recovery Rate</div>
                  <div className="text-2xl font-semibold">--%</div>
                </div>
                <div className="col-span-2 mt-2 p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">Alerts</div>
                    <div className="text-sm font-medium text-red-600">-- open</div>
                  </div>

                  <div className="mt-3 h-28 flex items-center">
                    <svg width="100%" height="80" viewBox="0 0 200 60" preserveAspectRatio="none">
                      <polyline fill="none" stroke="#6366f1" strokeWidth="2" points="" />
                      <polyline fill="#eef2ff" stroke="none" points="" opacity="0.9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <h3 className="text-sm font-medium text-slate-600">Upcoming checks</h3>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-medium">--</div>
                    <div className="text-xs text-slate-500">-- • --</div>
                  </div>
                  <div className="text-xs text-slate-400">View</div>
                </li>
              </ul>
            </div>
          </section>

          <section className="lg:col-span-3 space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Active Patients</h3>
                <span className="text-sm text-slate-500"></span>
              </div>

              <div className="flex items-center gap-3">
                
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="text-xs text-slate-500 border-b">
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Surgery</th>
                    <th className="py-3 px-2">Post-op days</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <div className="font-medium">--</div>
                      <div className="text-xs text-slate-500">--</div>
                    </td>
                    <td className="py-3 px-2 text-sm">--</td>
                    <td className="py-3 px-2 text-sm">-- days</td>
                    <td className="py-3 px-2 text-sm">
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-500">--</span>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Link to="#" className="text-indigo-600 text-sm">View</Link>
                        <button className="text-sm text-slate-500">Notes</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-full flex gap-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm w-full">
                <h4 className="text-sm font-medium text-slate-600">Recent notes</h4>
                <div className="mt-3 space-y-3 text-sm text-slate-700 w-full">
                  <div className="p-3 bg-base-200 rounded-lg w-full">--</div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Surgery Recovery Management</footer>
      </div>
    </div>
  );
}