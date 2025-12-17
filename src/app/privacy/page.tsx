"use client"

import { useLanguage } from "@/context/LanguageContext"

export default function PrivacyPolicyPage() {
    const { language } = useLanguage()

    return (
        <div className="container max-w-3xl py-10 px-4 mx-auto font-handwriting">
            <h1 className="text-3xl font-bold mb-6 text-primary">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">
                Effective Date: 2025-12-18
            </p>

            <div className="space-y-8 text-foreground text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-bold mb-3 text-primary">1. Information We Collect</h2>
                    <p className="mb-2">We collect the following types of personal information to provide our AI-powered diary service:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Account Information:</strong> Name (or Nickname), email address, profile picture, and user ID provided by authentication providers (e.g., Google, Supabase Auth). <em>Note: We do not store raw passwords; they are securely managed by our authentication provider.</em></li>
                        <li><strong>Service Usage Data:</strong> Diary text entries, AI-generated images, date and time of entries, mood data, device information, access logs, cookies, and IP address.</li>
                        <li><strong>Payment Information:</strong> Transaction history, order IDs, and payment method used. <em>Important: We do not store full credit card numbers or bank account details. All financial transactions are processed securely by our payment processors (Toss Payments, PayPal).</em></li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-primary">2. Purpose of Data Use</h2>
                    <p className="mb-2">We use personal information for the following specific purposes:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>To provide, operate, and maintain the "Picture Diary" service.</li>
                        <li>To generate artwork: Your text entries are processed by AI models (Google Vertex AI) solely for the purpose of creating your diary images.</li>
                        <li>To manage user accounts and authentication.</li>
                        <li>To process payments and refund requests.</li>
                        <li>To detect and prevent fraudulent activity (security).</li>
                        <li>To comply with applicable laws and regulations.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-primary">3. Data Retention</h2>
                    <p className="mb-2">We retain personal information only as long as necessary:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Account & Service Data:</strong> Retained until you delete your account or request deletion. Upon deletion, data is removed from our live databases immediately (or within 30 days depending on backups).</li>
                        <li><strong>Payment Records:</strong> Retained for 5 years to comply with tax and financial regulations (e.g., Electronic Financial Transactions Act).</li>
                        <li><strong>Server Logs:</strong> Retained for 1 year for security monitoring and analytics.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-primary">4. Sharing and Outsourcing (Third-Party Processors)</h2>
                    <p className="mb-4">We do not sell your personal data. To provide our service, we entrust specific data processing tasks to the following trusted third-party vendors:</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-primary">
                                    <th className="py-2 pr-4">Vendor</th>
                                    <th className="py-2 pr-4">Purpose</th>
                                    <th className="py-2">Country</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr className="group hover:bg-muted/50">
                                    <td className="py-2 pr-4 font-bold">Supabase</td>
                                    <td className="py-2 pr-4">Database, Authentication, Storage</td>
                                    <td className="py-2">USA / Singapore</td>
                                </tr>
                                <tr className="group hover:bg-muted/50">
                                    <td className="py-2 pr-4 font-bold">Google Cloud (Vertex AI)</td>
                                    <td className="py-2 pr-4">AI Image Generation</td>
                                    <td className="py-2">USA / Global</td>
                                </tr>
                                <tr className="group hover:bg-muted/50">
                                    <td className="py-2 pr-4 font-bold">Vercel</td>
                                    <td className="py-2 pr-4">Web Hosting & Edge Network</td>
                                    <td className="py-2">USA</td>
                                </tr>
                                <tr className="group hover:bg-muted/50">
                                    <td className="py-2 pr-4 font-bold">Toss Payments</td>
                                    <td className="py-2 pr-4">Payment Processing (Korea)</td>
                                    <td className="py-2">South Korea</td>
                                </tr>
                                <tr className="group hover:bg-muted/50">
                                    <td className="py-2 pr-4 font-bold">PayPal</td>
                                    <td className="py-2 pr-4">Payment Processing (Global)</td>
                                    <td className="py-2">USA / Global</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-primary">5. User Rights</h2>
                    <p className="mb-2">Depending on your location (including GDPR for EU, CCPA for California, and PIPA for Korea), you have the right to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                        <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
                        <li><strong>Deletion:</strong> Request deletion of your account and all associated data ("Right to be Forgotten").</li>
                        <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time.</li>
                        <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
                    </ul>
                    <p className="mt-2">To exercise these rights, please contact us at the email provided below.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-primary">6. Security Measures</h2>
                    <p className="mb-2">We implement robust technical and organizational measures to protect your data:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Encryption:</strong> All data in transit is encrypted via TLS/SSL (HTTPS). Data at rest in our database is encrypted.</li>
                        <li><strong>Access Control:</strong> Strict Row Level Security (RLS) policies ensure only you can access your private diary entries.</li>
                        <li><strong>Minimal Access:</strong> Only authorized personnel have access to system logs for maintenance purposes.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-primary">7. Data Protection Officer (Contact)</h2>
                    <p>If you have any questions about this Privacy Policy or your data, please contact:</p>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                        <p><strong>Name:</strong> Jung Jidu</p>
                        <p><strong>Position:</strong> Data Protection Officer (DPO)</p>
                        <p><strong>Email:</strong> <a href="mailto:wjdwlen@naver.com" className="text-primary hover:underline">wjdwlen@naver.com</a></p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-3 text-primary">8. Policy Updates</h2>
                    <p>We may update this Privacy Policy to reflect changes in our service or legal obligations. Significant changes will be notified via the website or email. The latest version will always be available on this page.</p>
                </section>
            </div>

            <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm">
                &copy; 2025 DoodleLog AI. All rights reserved.
            </div>
        </div>
    )
}
