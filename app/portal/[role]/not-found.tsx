import Link from 'next/link';
export default function NotFound() { return <div className="empty" style={{ padding: 60 }}><h1 className="h1">Page not found</h1><p className="lead" style={{ margin: '8px auto' }}>That page or record does not exist.</p><Link className="btn primary" href="overview">Back to dashboard</Link></div>; }
