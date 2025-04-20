import JobPostContent from './JobPostContent';

export default function Page({ params }: { params: { id: string } }) {
  return <JobPostContent postId={params.id} />;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Post ${params.id}`,
  };
} 