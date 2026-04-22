import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Gallery | Explore Daily Drawings",
    description: "Explore the daily drawings and memories shared by users worldwide. See how AI turns moments into art.",
    openGraph: {
        title: "Gallery | Doodle Log",
        description: "Explore the daily drawings and memories shared by users worldwide.",
    }
};

export default function GalleryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
