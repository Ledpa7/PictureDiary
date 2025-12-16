"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

type Diary = {
    id: string;
    created_at: string;
    content: string;
    image_url: string;
    prompt: string | null;
    user_id: string;
};

export default function AdminPage() {
    const [diaries, setDiaries] = useState<Diary[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const router = useRouter();

    useEffect(() => {
        const checkAdminAndFetch = async () => {
            // 1. Check Admin Auth
            const { data: { user } } = await supabase.auth.getUser();

            // TODO: Add your admin email here
            const ADMIN_EMAILS = ["wjdwlen@gmail.com", "ai.km.auto@gmail.com"];

            if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
                alert("관리자 권한이 없습니다. (접근 불가)");
                router.replace("/");
                return;
            }

            // 2. Fetch Diaries (Only if Admin)
            const { data, error } = await supabase
                .from('diaries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching diaries:', error);
                alert('다이어리 목록을 불러오는데 실패했습니다.');
            } else {
                setDiaries(data || []);
            }
            setLoading(false);
        };

        checkAdminAndFetch();
    }, [supabase, router]);

    if (loading) return <div className="p-10 text-center">Loading Admin Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard: Diary Prompts</h1>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Image</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Created At</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Content (Title + Story)</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Gemini Prompt</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">User ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {diaries.map((diary) => (
                            <tr key={diary.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">
                                    {diary.image_url ? (
                                        <div className="relative w-20 h-20">
                                            <Image
                                                src={diary.image_url}
                                                alt="Diary"
                                                fill
                                                className="object-cover rounded border"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">No Image</span>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                    {new Date(diary.created_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-800 max-w-xs break-words">
                                    {diary.content}
                                </td>
                                <td className="px-4 py-2 text-sm text-blue-700 bg-blue-50 max-w-md break-words font-mono">
                                    {diary.prompt || 'No Prompt Recorded'}
                                </td>
                                <td className="px-4 py-2 text-xs text-gray-400 font-mono">
                                    {diary.user_id}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {diaries.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    저장된 일기가 없거나 권한이 없습니다. (Supabase RLS 정책 확인 필요)
                </div>
            )}
        </div>
    );
}
