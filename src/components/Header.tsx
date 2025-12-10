import Link from "next/link";
import { auth, signIn, signOut } from "@/auth"

export async function Header() {
    const session = await auth()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                <Link className="mr-6 flex items-center space-x-2 font-bold text-xl text-primary" href="/">
                    <span>My Picture Diary</span>
                </Link>
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
                    {session?.user ? (
                        <div className="flex items-center gap-4">
                            {session.user.image && (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    className="w-8 h-8 rounded-full border border-border"
                                />
                            )}
                            <form
                                action={async () => {
                                    "use server"
                                    await signOut()
                                }}
                            >
                                <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    ) : (
                        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
