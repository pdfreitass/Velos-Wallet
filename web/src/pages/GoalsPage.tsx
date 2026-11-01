import { Plus } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { GoalList } from "@/features/goals/GoalList";
import { ROUTES } from "@/lib/auth/routes";

/** /metas (spec 006, T5). */
export function GoalsPage() {
  return (
    <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-5xl">
      <title>Metas · Velos Wallet</title>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Metas</h1>
        <Link to={ROUTES.newGoal} className={cn(buttonVariants(), "h-11 px-4 text-base")}>
          <Plus aria-hidden="true" />
          Nova
          <span className="sr-only"> meta</span>
        </Link>
      </div>
      <GoalList />
    </div>
  );
}
