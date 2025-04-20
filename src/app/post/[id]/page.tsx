import { Metadata } from 'next';
import JobPostContent from './JobPostContent';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Post ${params.id}`,
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <JobPostContent postId={params.id} />;
} 