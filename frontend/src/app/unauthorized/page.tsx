import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Access Denied</h2>
                <p className="text-gray-500 mb-8">
                    You don&apos;t have permission to view this page.
                </p>
                <Link
                    href="/"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
