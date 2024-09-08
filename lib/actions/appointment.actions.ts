"use server";

import { ID, Query } from "node-appwrite";
import {
  APPOINTMENT_COLLECTION_ID,
  DATABASE_ID,
  databases,
  messaging,
} from "../appwrite.config";
import { formatDateTime, parseStringify } from "../utils";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";

// Create Appointment
export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      appointment
    );

    // Revalidate the admin page cache
    revalidatePath("/admin");

    return parseStringify(newAppointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw new Error("Failed to create appointment.");
  }
};

// Get Appointment by ID
export const getAppointment = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId
    );

    if (!appointment) throw new Error("Appointment not found.");

    return parseStringify(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    throw new Error("Failed to fetch appointment.");
  }
};

// Get Recent Appointments List
export const getRecentAppointmentsList = async () => {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.orderDesc("$createdAt")]
    );

    if (!appointments.documents) throw new Error("No appointments found.");

    // Count appointments based on status
    const initialCounts = {
      scheduleCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    const counts = (appointments.documents as Appointment[]).reduce(
      (acc, appointment) => {
        switch (appointment.status) {
          case "scheduled":
            acc.scheduleCount += 1;
            break;
          case "pending":
            acc.pendingCount += 1;
            break;
          case "cancelled":
            acc.cancelledCount += 1;
            break;
        }
        return acc;
      },
      initialCounts
    );

    // Prepare the final data structure
    const data = {
      totalCount: appointments.total,
      ...counts,
      documents: appointments.documents,
    };

    return parseStringify(data);
  } catch (error) {
    console.error("Error fetching recent appointments:", error);
    throw new Error("Failed to fetch recent appointments.");
  }
};

// Update Appointment
export const updateAppointment = async ({
  appointmentId,
  userId,
  appointment,
  type,
}: UpdateAppointmentParams) => {
  try {
    // Update the appointment document
    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      appointment
    );

    if (!updatedAppointment) throw new Error("Appointment not found.");

    // Construct SMS notification content
    const smsMessage =
      type === "schedule"
        ? `Hi, it's CarePulse. Your appointment has been scheduled for ${
            formatDateTime(appointment.schedule!).dateTime
          } with Dr. ${appointment.primaryPhysician}.`
        : `Hi, it's CarePulse. We regret to inform you that your appointment has been cancelled for the following reason: ${appointment.cancellationReason}.`;

    // Send SMS notification
    await sendSMSNotification(userId, smsMessage);

    // Revalidate the admin page cache
    revalidatePath("/admin");

    return parseStringify(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment.");
  }
};

// Send SMS Notification
export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    const message = await messaging.createSms(
      ID.unique(),
      content,
      [],
      [userId]
    );
    return parseStringify(message);
  } catch (error) {
    console.error("Error sending SMS notification:", error);
    throw new Error("Failed to send SMS notification.");
  }
};
