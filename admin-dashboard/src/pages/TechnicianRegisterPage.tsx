import AdminLayout from '../components/AdminLayout';
import TechnicianRegisterForm from '../components/TechnicianRegisterForm';

export default function TechnicianRegisterPage() {
  return (
    <AdminLayout activeTab="technicians">
      <TechnicianRegisterForm />
    </AdminLayout>
  );
}
