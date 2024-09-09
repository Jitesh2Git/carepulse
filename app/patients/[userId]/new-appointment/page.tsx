import AppointmentForm from "@/components/forms/AppointmentForm";
import { getPatient } from "@/lib/actions/patient.actions";
import Image from "next/image";
import * as Sentry from "@sentry/nextjs";

const NewAppointment = async ({ params: { userId } }: SearchParamProps) => {
  const patient = await getPatient(userId);

  Sentry.metrics.set("user_view_new-appointment", patient?.name);

  return (
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container">
        <div className="sub-container max-w-[860px] flex-1 flex-col py-10">
          <Image
            src="/assets/icons/logo-full.svg"
            alt="patient"
            width={1000}
            height={1000}
            className="mb-12 h-10 w-fit"
          />
          {/* @ts-ignore */}
          <AppointmentForm
            type="create"
            userId={userId}
            patientId={patient?.$id}
          />
          <p className="copyright mt-10 py-12">&copy; 2024 CarePulse</p>
        </div>
      </section>
      <Image
        src="/assets/images/appointment-img.png"
        alt="patient"
        width={1000}
        height={1000}
        className="side-img max-w-[390px] bg-bottom"
        priority
      />
    </div>
  );
};

export default NewAppointment;
