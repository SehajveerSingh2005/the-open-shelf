"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ArticleRedirectPage() {
  const router = useRouter();
  const params = useParams();
  
  useEffect(() => {
    if (params.articleId) {
      router.replace(`/shelf?article=${params.articleId}`);
    } else {
      router.replace('/shelf');
    }
  }, [params, router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#fafafa]">
      <div className="animate-pulse text-[10px] uppercase tracking-widest text-gray-400 font-sans">
        Restoring your shelf...
      </div>
    </div>
  );
}