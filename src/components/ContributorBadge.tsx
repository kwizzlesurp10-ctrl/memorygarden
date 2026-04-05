import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface ContributorBadgeProps {
  login: string
  avatarUrl: string
  className?: string
}

export function ContributorBadge({ login, avatarUrl, className = '' }: ContributorBadgeProps) {
  return (
    <div className={`absolute -bottom-1 -right-1 z-10 ${className}`} title={`Planted by ${login}`}>
      <Avatar className="w-5 h-5 border-2 border-background">
        <AvatarImage src={avatarUrl} alt={login} />
        <AvatarFallback className="text-[8px]">{login[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
  )
}
