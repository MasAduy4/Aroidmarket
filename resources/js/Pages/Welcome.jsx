import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Selamat Datang" />
            <div className="relative flex items-top justify-center min-h-screen bg-gray-100 items-center py-4 sm:pt-0">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Sistem Informasi Pengelolaan Lahan Pertanian
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Kelompok Tani Optimus Farm - Pangalengan
                    </p>
                    <div className="space-x-4">
                        <Link
                            href={route('login')}
                            className="px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700"
                        >
                            Log in
                        </Link>
                        <Link
                            href={route('register')}
                            className="px-6 py-3 bg-gray-800 text-white rounded-md font-semibold hover:bg-gray-900"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
