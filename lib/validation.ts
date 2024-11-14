import { z } from "zod";

export const UserFormValidation = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .refine((phone) => /^\+\d{10,15}$/.test(phone), "Invalid phone number"),
});

export const PatientFormValidation = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .refine((phone) => /^\+\d{10,15}$/.test(phone), "Invalid phone number"),
    birthDate: z.coerce.date().refine((date) => date <= new Date(), {
      message: "Date of birth cannot be in the future.",
    }),
    gender: z.enum(["Male", "Female"]),
    address: z
      .string()
      .min(5, "Address must be at least 5 characters")
      .max(500, "Address must be at most 500 characters"),
    occupation: z
      .string()
      .min(2, "Occupation must be at least 2 characters")
      .max(500, "Occupation must be at most 500 characters"),
    emergencyContactName: z
      .string()
      .min(2, "Contact name must be at least 2 characters")
      .max(50, "Contact name must be at most 50 characters"),
    emergencyContactNumber: z
      .string()
      .refine((number) => /^\+\d{10,15}$/.test(number), "Invalid phone number"),
    primaryPhysician: z.string().min(2, "Select at least one doctor"),
    insuranceProvider: z
      .string()
      .min(2, "Insurance name must be at least 2 characters")
      .max(50, "Insurance name must be at most 50 characters"),
    insurancePolicyNumber: z
      .string()
      .min(2, "Policy number must be at least 2 characters")
      .max(50, "Policy number must be at most 50 characters"),
    identificationDocument: z
      .custom<File[]>()
      .refine(
        (files) => files && files.length > 0,
        "Identification document is required."
      )
      .refine((files) => {
        return files.every((file) => file.size <= 50 * 1024 * 1024);
      }, "File size must not exceed 50MB.")
      .refine(async (files) => {
        const checkDimensions = async (file: File) => {
          return new Promise<boolean>((resolve, reject) => {
            const img = new Image();
            const objectURL = URL.createObjectURL(file);
            img.onload = function () {
              const width = img.width;
              const height = img.height;
              if (width <= 1024 && height <= 1024) {
                resolve(true);
              } else {
                reject(
                  "Image dimensions must be less than or equal to 1024x1024"
                );
              }
            };
            img.onerror = function () {
              reject("Error loading image");
            };
            img.src = objectURL;
          });
        };
        for (let file of files) {
          try {
            await checkDimensions(file);
          } catch (error) {
            return false;
          }
        }
        return true;
      }, "Identification document dimensions must not exceed 1024x1024 pixels."),
    treatmentConsent: z
      .boolean()
      .default(false)
      .refine((value) => value === true, {
        message: "You must consent to treatment in order to proceed",
      }),
    disclosureConsent: z
      .boolean()
      .default(false)
      .refine((value) => value === true, {
        message: "You must consent to disclosure in order to proceed",
      }),
    privacyConsent: z
      .boolean()
      .default(false)
      .refine((value) => value === true, {
        message: "You must consent to privacy in order to proceed",
      }),
  })
  .refine((data) => data.name !== data.emergencyContactName, {
    message: "Emergency contact name cannot be the same as the patient's name",
    path: ["emergencyContactName"],
  })
  .refine((data) => data.phone !== data.emergencyContactNumber, {
    message:
      "Emergency contact number cannot be the same as the patient's phone number",
    path: ["emergencyContactNumber"],
  });

export const CreateAppointmentSchema = z.object({
  primaryPhysician: z.string().min(2, "Select at least one doctor"),
  schedule: z.coerce
    .date()
    .refine((date) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return date >= today;
    }, "Appointment date cannot be in the past.")
    .refine((date) => {
      const now = new Date();
      const minDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      return date >= minDate;
    }, "Appointment must be scheduled at least 24 hours in advance."),
  reason: z
    .string()
    .min(2, "Reason must be at least 2 characters")
    .max(500, "Reason must be at most 500 characters"),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const ScheduleAppointmentSchema = z.object({
  primaryPhysician: z.string().min(2, "Select at least one doctor"),
  schedule: z.coerce.date().refine((date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date >= today;
  }, "Appointment date cannot be in the past."),
  reason: z.string().optional(),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const CancelAppointmentSchema = z.object({
  primaryPhysician: z.string().min(2, "Select at least one doctor"),
  schedule: z.coerce.date(),
  reason: z.string().optional(),
  note: z.string().optional(),
  cancellationReason: z
    .string()
    .min(2, "Reason must be at least 2 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export function getAppointmentSchema(type: string) {
  switch (type) {
    case "create":
      return CreateAppointmentSchema;
    case "cancel":
      return CancelAppointmentSchema;
    default:
      return ScheduleAppointmentSchema;
  }
}
