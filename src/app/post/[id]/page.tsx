'use client';

import JobPostContent from './JobPostContent';

export default function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return <JobPostContent postId={params.id} />;
} 