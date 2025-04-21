'use client';

import JobPostContent from './JobPostContent';

export default function Page({ params }: { params: { id: string } }) {
  return <JobPostContent postId={params.id} />;
} 