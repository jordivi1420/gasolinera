// src/components/profile/UserInfoCard.tsx
import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile } from "../../services/users.service";

type Personal = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
};

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, profile } = useAuth();

  const [personal, setPersonal] = useState<Personal>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });

  useEffect(() => {
    if (!profile) return;
    // Ajusta estos campos a los que tengas en tu RTDB (ejemplos comunes)
    setPersonal({
      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      email: profile.email ?? user?.email ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
    });
  }, [profile, user]);

  const handleSave = async () => {
    if (!user?.uid) return;
    await updateUserProfile(user.uid, {
      first_name: personal.firstName,
      last_name: personal.lastName,
      email: personal.email, // ojo: si cambias email “real” de Auth, hay que usar updateEmail(auth)
      phone: personal.phone,
      bio: personal.bio,
    });
    closeModal();
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      {/* …tu vista de lectura igual que antes, pero mostrando personal.* … */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">First Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {personal.firstName || "—"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Last Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {personal.lastName || "—"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {personal.email || "—"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {personal.phone || "—"}
              </p>
            </div>
            <div className="lg:col-span-2">
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Bio</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {personal.bio || "—"}
              </p>
            </div>
          </div>
        </div>

        <button onClick={openModal} className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 lg:inline-flex lg:w-auto">
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Personal Information</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Update your details.</p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3 grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input value={personal.firstName} onChange={(e: any)=>setPersonal(p=>({...p, firstName:e.target.value}))}/>
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={personal.lastName} onChange={(e: any)=>setPersonal(p=>({...p, lastName:e.target.value}))}/>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={personal.email} onChange={(e: any)=>setPersonal(p=>({...p, email:e.target.value}))}/>
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={personal.phone} onChange={(e: any)=>setPersonal(p=>({...p, phone:e.target.value}))}/>
              </div>
              <div className="lg:col-span-2">
                <Label>Bio</Label>
                <Input value={personal.bio} onChange={(e: any)=>setPersonal(p=>({...p, bio:e.target.value}))}/>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={closeModal}>Close</Button>
              <Button size="sm" type="button" onClick={handleSave}>Save Changes</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
