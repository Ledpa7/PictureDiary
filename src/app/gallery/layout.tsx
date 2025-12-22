import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Gallery",
    description: "Explore the daily drawings and memories shared by other users.",
    openGraph: {
        title: "Gallery | Doodle Log",
        description: "Explore the daily drawings and memories shared by other users.",
    }
};

export default function GalleryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
