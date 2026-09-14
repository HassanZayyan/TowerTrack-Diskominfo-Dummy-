import MainLayout from '@/Layouts/MainLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <MainLayout currentPage="/profile">
            <Head title="Edit Profil - TowerTrack" />

            <div className="min-h-screen bg-muted py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground">Edit Profil</h1>
                        <p className="mt-2 text-muted-foreground">Kelola informasi profil dan pengaturan akun Anda</p>
                    </div>

                    <div className="space-y-6">
                        {/* Profile Information */}
                        <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className=""
                            />
                        </div>

                        {/* Update Password */}
                        <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                            <UpdatePasswordForm className="" />
                        </div>

                        {/* Delete Account */}
                        <div className="bg-white rounded-lg shadow-sm border border-destructive-border p-6">
                            <DeleteUserForm className="" />
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
