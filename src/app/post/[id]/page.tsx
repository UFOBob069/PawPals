import JobPostContent from './JobPostContent';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

async function JobPostPage({ params, searchParams }: Props) {
  return <JobPostContent postId={params.id} />;
}

export default JobPostPage; 