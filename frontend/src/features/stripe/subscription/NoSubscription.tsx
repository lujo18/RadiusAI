import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

export const NoSubscription = () => {
  return (
    <Card className="max-w-2xl border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">No active subscription</p>
            <p className="text-sm text-foreground/60 mt-1">
              Choose a plan below to unlock all features and remove limits.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
