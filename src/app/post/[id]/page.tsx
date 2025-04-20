import JobPostContent from './JobPostContent';

export default async function JobPostPage({ params }: { params: { id: string } }) {
  return <JobPostContent postId={params.id} />;
} 