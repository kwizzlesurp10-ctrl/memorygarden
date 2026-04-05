import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Crown, Eye, Users } from '@phosphor-icons/react'
import type { CollaborativeGarden, GardenMember } from '@/lib/types'

interface GardenMembersPanelProps {
  garden: CollaborativeGarden
  onInvite: () => void
}

const roleIcons = {
  owner: Crown,
  collaborator: Users,
  viewer: Eye,
}

export function GardenMembersPanel({ garden, onInvite }: GardenMembersPanelProps) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Members ({garden.members.length})</h3>
        <Button variant="ghost" size="sm" onClick={onInvite} className="h-7 text-xs">
          <UserPlus size={14} className="mr-1" />
          Invite
        </Button>
      </div>

      <div className="space-y-2">
        {garden.members.map((member) => {
          const RoleIcon = roleIcons[member.role]
          return (
            <div key={member.userId} className="flex items-center gap-2 py-1">
              <Avatar className="w-7 h-7">
                <AvatarImage src={member.avatarUrl} alt={member.login} />
                <AvatarFallback className="text-xs">{member.login[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{member.login}</p>
              </div>
              <Badge variant="outline" className="text-xs capitalize gap-1">
                <RoleIcon size={10} />
                {member.role}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}
