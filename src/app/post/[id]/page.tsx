import JobPostContent from './JobPostContent';

interface PageProps {
  params: { id: string };
}

export default async function Page({ params }: PageProps) {
  return <JobPostContent postId={params.id} />;
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Post ${params.id}`,
  };
} 