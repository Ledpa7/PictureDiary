"use client"

import Link from "next/link";
import { Search, X, Globe, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const { language } = useLanguage();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile?.avatar_url) {
                    setAvatarUrl(profile.avatar_url);
                } else {
                    setAvatarUrl(user.user_metadata.avatar_url);
                }
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                // Quick refresh on auth change
                supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single()
                    .then(({ data }) => {
                        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
                        else setAvatarUrl(session.user.user_metadata.avatar_url);
                    });
            } else {
                setAvatarUrl(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setAvatarUrl(null);
        setIsMenuOpen(false); // Close mobile menu if open
        router.push("/");
    };

    const handleLogin = async () => {
        try {
            const redirectUrl = `${location.origin}/auth/callback?next=/gallery`;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Login Error:', error);
            alert((language === 'ko' ? '로그인 오류가 발생했습니다: ' : 'Login Error: ') + error.message);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length === 0) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${query}%`)
                .limit(5);

            if (data) setSearchResults(data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center px-4 justify-between">
                    <div className="flex items-center">
                        <Link className="mr-6 flex items-center space-x-2 font-bold text-xl text-primary cursor-pointer hover:opacity-80 transition-opacity" href="/">
                            <span>Doodle Log</span>
                        </Link>
                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                            {user && (
                                <Link
                                    href="/gallery"
                                    className={`transition-colors hover:text-foreground/80 ${pathname === '/gallery' ? 'text-foreground font-bold' : 'text-foreground/60'}`}
                                >
                                    <span>{language === 'ko' ? '다른 사람의 기록' : "Other People's Logs"}</span>
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link href={`/gallery/${user.id}`}>
                                    <img
                                        src={avatarUrl || user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`}
                                        alt={user.user_metadata.full_name || "User"}
                                        className="w-8 h-8 rounded-full border border-border object-cover hover:opacity-80 transition-opacity"
                                    />
                                </Link>

                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2 text-foreground hover:opacity-70 transition-opacity"
                                    title={language === 'ko' ? "사용자 검색" : "Search Users"}
                                >
                                    <Search size={22} />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                                >
                                    <span>{language === 'ko' ? '로그아웃' : 'Logout'}</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                            >
                                {language === 'ko' ? '로그인' : 'Sign In'}
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center">
                        {user ? (
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-foreground hover:opacity-70 transition-opacity"
                            >
                                {isMenuOpen ? <X size={24} /> : <Search className="hidden" /> /* Hack to keep imports valid if Search was used alone, but we need Menu */}
                                {isMenuOpen ? null : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>}
                            </button>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                            >
                                {language === 'ko' ? '로그인' : 'Sign In'}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && user && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Side Drawer */}
                    <div className="fixed inset-y-0 right-0 z-[70] w-[65%] max-w-[280px] bg-background/95 backdrop-blur-md border-l border-border px-6 pb-6 shadow-2xl md:hidden animate-in slide-in-from-right-[100%] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col">
                        <div className="h-14 flex items-center justify-end -mr-2 mb-6">
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-foreground hover:opacity-70"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="flex flex-col space-y-4 text-base font-medium">
                            {/* Profile Section - Acts as "My Diary" link */}
                            <Link
                                href={`/gallery/${user.id}`}
                                className="flex items-center gap-4 py-4 mb-2 border-b border-border/50 hover:bg-muted/50 rounded-lg -mx-2 px-2 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <img
                                    src={avatarUrl || user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`}
                                    alt="Profile"
                                    className="w-14 h-14 rounded-full border border-border object-cover"
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-lg">{user.user_metadata.full_name || "User"}</span>
                                    {user.email && (
                                        <div className="flex flex-col text-sm text-muted-foreground leading-tight">
                                            <span className="truncate max-w-[150px]">{user.email.split('@')[0]}</span>
                                            <span className="text-xs">@{user.email.split('@')[1]}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsSearchOpen(true);
                                }}
                                className="flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors text-left"
                            >
                                <Search className="w-5 h-5 text-muted-foreground" />
                                <span>{language === 'ko' ? '검색' : 'Search'}</span>
                            </button>

                            <Link
                                href="/gallery"
                                className="flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Globe className="w-5 h-5 text-muted-foreground" />
                                <span>{language === 'ko' ? '다른 사람의 기록' : "Other People's Logs"}</span>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 py-3 px-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left mt-auto"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>{language === 'ko' ? '로그아웃' : 'Logout'}</span>
                            </button>
                        </nav>
                    </div>
                </>
            )}

            {/* Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
                    <div
                        className="bg-card w-full max-w-md p-4 rounded-lg shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                autoFocus
                                type="text"
                                placeholder={language === 'ko' ? "사용자 이름을 입력하세요..." : "Search by username..."}
                                className="w-full bg-muted/50 border border-border rounded-md pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {searchResults.length > 0 ? (
                                searchResults.map((profile) => (
                                    <div
                                        key={profile.id}
                                        onClick={() => {
                                            router.push(`/gallery/${profile.id}`);
                                            setIsSearchOpen(false);
                                        }}
                                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border shrink-0">
                                            <img
                                                src={profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.id}`}
                                                alt={profile.username}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">{profile.username || `User_${profile.id.slice(0, 4)}`}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{profile.description || "No description"}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                searchQuery.trim().length > 0 && (
                                    <div className="text-center text-muted-foreground py-4 text-sm">
                                        {language === 'ko' ? "검색 결과가 없습니다." : "No users found."}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
