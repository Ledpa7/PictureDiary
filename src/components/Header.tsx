"use client"

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <a className="mr-6 flex items-center space-x-2 font-bold text-xl text-primary cursor-pointer hover:opacity-80 transition-opacity" href="/">
                    <span>My Picture Diary</span>
                </a>
                <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
                    <Link
                        href="/journal"
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Journal
                    </Link>
                    <Link
                        href="/gallery"
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Gallery
                    </Link>
                </nav>
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            {user.user_metadata.avatar_url && (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt={user.user_metadata.full_name || "User"}
                                    className="w-8 h-8 rounded-full border border-border"
                                />
                            )}
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
