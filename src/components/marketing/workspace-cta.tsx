"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/session";
import { ArrowRight, FlaskConical } from "lucide-react";
import type { Workspace } from "@/lib/workspace";

// Landing-page call to action. Makes the choice explicit: start a clean real
// workspace, or explore the isolated Nova demo. Setting the workspace here is
// what guarantees a new user's own workspace starts empty (no demo records).
export function WorkspaceCTA({
  size = "lg",
}: {
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const { setWorkspace } = useSession();

  const go = (ws: Workspace) => {
    setWorkspace(ws);
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size={size} onClick={() => go("real")}>
        Set up my workspace <ArrowRight className="h-4 w-4" />
      </Button>
      <Button size={size} variant="outline" onClick={() => go("demo")}>
        <FlaskConical className="h-4 w-4" /> Explore the demo
      </Button>
    </div>
  );
}
