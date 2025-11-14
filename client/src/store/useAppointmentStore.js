import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';

import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';

export const useAppointmentStore = create((set, get) => ({
    isLoading: false,
    appointments: [],
    selectedDoctorAvailableSlots: [],

    getAppointments: async () => {
        try {
            const res = await axiosInstance.get("/appointments/");
            set({ appointments: res.data })
        } catch (error) {
            console.log("Error occured in getAppointments zustand store: ", error);
        }
    },

    createAppointment: async (data) => {
        try {
            const res = await axiosInstance.post("/appointments/", data);
            toast.success(res.data.message);
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
            toast.error("An Error occurred while scheduling an Appointment")
        }
    },

    // for patient to see the available slots for a doctor
    getDoctorAvailability: async (doctorUserId, date) => {
        try {
            const res = await axiosInstance.get(`/appointments/availability`,
                {
                    params: {
                        doctor: doctorUserId,
                        date: date,
                    }
                }
            );
            set({ selectedDoctorAvailableSlots: res.data.availableSlots })
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },

    updateAppointmentById: async (appointmentId, data) => {
        try {
            const appointments = get().appointments;

            const res = await axiosInstance.patch(`/appointments/${appointmentId}`, data);
            const updatedAppointment = res.data.appointment;
            // console.log('deleted Appointment is: ', udpatedAppointment)
            const filteredAppointments = appointments.filter((appointment) => {
                return String(appointment._id) !== String(updatedAppointment._id)
            });
            set({ appointments: [...filteredAppointments, updatedAppointment] });

            toast.success(res.data.message);
        } catch (error) {
            toast.error(error?.response?.data?.message);
            console.log("An Error occurred in updateAppointmentById zustand Store: ", error);
        }
    },


    cancelAppointmentById: async (appointmentId, data) => {
        try {
            const appointments = get().appointments;
            // Because POST automatically sends data as the request body and DELETE does NOT, so we have to send the body inside the object { data }
            const res = await axiosInstance.delete(`/appointments/${appointmentId}`, { data });
            const deletedAppointment = res.data.appointment;
            // console.log('deleted Appointment is: ', deletedAppointment)
            const filteredAppointments = appointments.filter((appointment) => {
                return String(appointment._id) !== String(deletedAppointment._id)
            });
            set({ appointments: [...filteredAppointments, deletedAppointment] });
            toast.success("Cancelled the Appointment Successfully");
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },

}))