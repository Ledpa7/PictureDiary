import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "New Diary",
    description: "Write your diary entry and let AI create a picture for you.",
};

export default function NewDiaryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
