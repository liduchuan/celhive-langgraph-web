import Link from "next/link";

export default function Page(): React.ReactNode {
  return <div>
    <h1>Welcome to CelHive Agent Chat!</h1>
    <Link href="/chat" className="text-2xl font-bold">Go to Chat</Link>
  </div>;
}
