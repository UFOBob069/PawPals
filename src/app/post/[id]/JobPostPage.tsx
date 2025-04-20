'use client';

import JobPostContent from './JobPostContent';

interface JobPostPageProps {
  params: { id: string };
}

export default function JobPostPage({ params }: JobPostPageProps) {
  return <JobPostContent postId={params.id} />;
} 