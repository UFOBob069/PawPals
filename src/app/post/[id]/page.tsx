import JobPostContent from './JobPostContent';

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function JobPostPage({ params }: PageProps) {
  return <JobPostContent postId={params.id} />;
} 