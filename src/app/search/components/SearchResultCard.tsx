import Image from 'next/image';
import { UserIcon } from '@/components/icons/UserIcon';

interface SearchResultCardProps {
  photoUrl?: string;
  name: string;
}

export default function SearchResultCard({ photoUrl, name }: SearchResultCardProps) {
  return (
    <div className="flex items-center gap-3">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          width={40}
          height={40}
          className="rounded-full"
          unoptimized
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <UserIcon className="w-6 h-6 text-gray-400" />
        </div>
      )}
    </div>
  );
} 