import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface StartNewGardenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  currentGardenName: string
}

export function StartNewGardenDialog({
  open,
  onOpenChange,
  onConfirm,
  currentGardenName,
}: StartNewGardenDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="start-new-garden-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Start a new garden?</AlertDialogTitle>
          <AlertDialogDescription>
            Your current garden, <strong>{currentGardenName}</strong>, will be kept safely in your
            garden list — nothing is deleted. Photos, memories, and shed items stay with that
            garden. You can switch back anytime.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid="start-new-garden-confirm">
            Start fresh garden
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}