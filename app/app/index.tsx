// app/index.tsx
import { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';

export default function Index() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  // No legacy code → nothing to do here
  if (!code) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  return <LegacyCodeRedirect code={code} />;
}

function LegacyCodeRedirect({ code }: { code: string }) {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const resolveSlug = async () => {
      const { data, error } = await supabase
        .from('business')
        .select('qr_slug')
        .eq('unique_identifier', code)
        .maybeSingle();

      if (!error && data?.qr_slug) {
        setSlug(data.qr_slug);
      }
    };

    resolveSlug();
  }, [code]);

  if (!slug) return null;

  // 🔁 FINAL redirect to clean URL
  return <Redirect href={`/${slug}`} />;
}
