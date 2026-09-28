import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { UserRow } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  onConfirm: () => void;
}

export function DeleteUserDialog({ open, onOpenChange, user, onConfirm }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="pt-2 space-y-3">
              <p>
                Are you sure you want to delete user <strong>"{user?.username}"</strong>?
              </p>
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-destructive">Warning: This action is irreversible</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    <li>All portal access will be revoked</li>
                    <li>All assigned roles will be removed</li>
                    <li>User will no longer be able to log in</li>
                    <li>This cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
