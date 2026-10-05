import Link from 'next/link';
export default function NotFound() { return <div style={{ padding: 80, textAlign: 'center' }}><h1 className="h1">Page not found</h1><p className="lead" style={{ margin: '8px auto' }}>That address does not exist in Nilam.</p><Link className="btn primary" href="/login">Go to sign in</Link></div>; }
