"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProtectedError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to your error reporting service here if needed
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">500</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Something went wrong</h2>
                <p className="text-gray-500 mb-8">
                    We couldn&apos;t load your account data. Please try again or sign in again.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/login"
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
                    >
                        Sign In Again
                    </Link>
                </div>
            </div>
        </div>
    );
}
