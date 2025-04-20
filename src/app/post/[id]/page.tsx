import JobPostContent from './JobPostContent';

type Props = {
  params: { id: string };
};

export default async function Page({ params }: Props) {
  return <JobPostContent postId={params.id} />;
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `Post ${params.id}`,
  };
} 