import { Metadata } from 'next';
import JobPostContent from './JobPostContent';

type Props = {
  params: { id: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: `Post ${params.id}`,
  };
}

export default function Page({ params }: Props) {
  return <JobPostContent postId={params.id} />;
} 