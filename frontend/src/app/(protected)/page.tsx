import { getUser } from "@/lib/supabase/auth";

// getUser() is cached — the layout already called it, so this is free (no extra DB query).
export default async function Home() {
    const data = await getUser();
    console.log(data);

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-4">
                    Welcome{data?.fullName ? `, ${data.fullName}` : ""}!
                </h2>
                <p className="text-gray-600">
                    You are logged in as {data?.user.email}
                </p>
                <p>Your role is: {data?.role}</p>
            </main>
        </div>
    );
}
