import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * Renders a simple content page whose title/body are edited by the admin
 * from Site Settings. Used for About, Blog, Contact, FAQ, Privacy Policy,
 * and Terms of Service — all share the same simple {title, body} shape.
 */
export default function StaticContentPage({ settingKey, fallbackTitle }) {
  const [content, setContent] = useState({ title: fallbackTitle, body: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/settings/${settingKey}`)
      .then(({ data }) => {
        if (data.value) setContent({ title: data.value.title || fallbackTitle, body: data.value.body || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [settingKey]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">{content.title}</h1>
      {loading ? (
        <p className="text-slate-400">جاري التحميل...</p>
      ) : content.body ? (
        <p className="whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">{content.body}</p>
      ) : (
        <p className="text-slate-400">لم يُضف محتوى لهذه الصفحة بعد.</p>
      )}
    </div>
  );
}
