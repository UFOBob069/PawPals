import { Metadata } from 'next';
import JobPostPage from './JobPostPage';

export const metadata: Metadata = {
  title: 'Job Post',
};

export default function Page({ params }: { params: { id: string } }) {
  return <JobPostPage params={params} />;
} 