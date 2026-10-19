import Link from "next/link";

export default function NotFound(){
    return(
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-8xl font-bold">404</h1>

            <h2 className="text-2xl font-semibold">
                Page Not Found
            </h2>

            <p className="text-gray-500">
                The page you are looking for does not exist.
            </p>

            <Link
            href="/"
            className="rounded-lg bg-berry px-6 py-3 text-white"
            >
                Go Home
            </Link>
        </main>
    )
}