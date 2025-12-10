"use client"

import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
                <h1 className="text-4xl font-bold text-primary">Sign In to Your Diary</h1>
                <p className="text-xl text-center max-w-md">
                    Connect with Google to start saving your memories.
                </p>

                <button
                    onClick={() => alert("Please verify your .env.local configuration for Google Auth.")}
                    className="rounded-full bg-white border border-gray-300 flex items-center gap-3 px-6 py-3 text-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <img src="https://authjs.dev/img/providers/google.svg" alt="Google logo" className="w-6 h-6" />
                    <span>Sign in with Google</span>
                </button>

                <div className="relative w-full max-w-xs py-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/journal/new')}
                    className="rounded-full bg-secondary/20 border border-secondary text-secondary-foreground flex items-center gap-3 px-6 py-2 text-base font-medium hover:bg-secondary/30 transition-colors"
                >
                    <span>Mock Login (Dev Mode)</span>
                </button>
            </div>
        </div>
    )
}
