"use server";

import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import {
  BUCKET_ID,
  DATABASE_ID,
  databases,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  PROJECT_ID,
  storage,
  users,
} from "../appwrite.config";
import { parseStringify } from "../utils";

// Helper: Validate email and phone uniqueness
const checkExistingUser = async (email: string, phone: string) => {
  const emailDocuments = await users.list([Query.equal("email", [email])]);

  if (emailDocuments.total > 0) {
    const existingUser = emailDocuments.users[0];
    if (existingUser.phone === phone) {
      return existingUser;
    } else {
      throw new Error(
        "Email already exists but with a different phone number."
      );
    }
  }

  const phoneDocuments = await users.list([Query.equal("phone", [phone])]);

  if (phoneDocuments.total > 0) {
    throw new Error("Phone number already exists but with a different email.");
  }

  return null;
};

// Create User
export const createUser = async (user: CreateUserParams) => {
  try {
    // Check for existing email and phone
    const existingUser = await checkExistingUser(user.email, user.phone);

    if (existingUser) {
      return parseStringify(existingUser);
    }

    // If no user exists, create a new one
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );

    return parseStringify(newUser);
  } catch (error: any) {
    console.error(error.message);
    throw new Error(error.message);
  }
};

// Get User by ID
export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId);
    return parseStringify(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Unable to fetch user.");
  }
};

// Register Patient
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file;

    // If an identification document is provided, upload it
    if (identificationDocument) {
      const blobFile = identificationDocument?.get("blobFile") as Blob;
      const fileName = identificationDocument?.get("fileName") as string;

      if (!blobFile || !fileName) {
        throw new Error("Invalid identification document data.");
      }

      // Upload document
      const inputFile = InputFile.fromBuffer(blobFile, fileName);
      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
    }

    // Create patient document
    const fileId = file?.$id || null;
    const fileUrl = fileId
      ? `${ENDPOINT}/storage/buckets.${BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`
      : null;

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: fileId,
        identificationDocumentUrl: fileUrl,
        ...patient,
      }
    );

    return parseStringify(newPatient);
  } catch (error) {
    console.error("Failed to register patient:", error);
    throw new Error("Patient registration failed.");
  }
};

// Get Patient by User ID
export const getPatient = async (userId: string) => {
  try {
    const patients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );

    if (patients.documents.length === 0) {
      throw new Error("Patient not found.");
    }

    return parseStringify(patients.documents[0]);
  } catch (error) {
    console.error("Failed to fetch patient:", error);
    throw new Error("Unable to fetch patient.");
  }
};
