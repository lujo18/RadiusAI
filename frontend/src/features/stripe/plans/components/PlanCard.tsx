import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PLANS, type PlanKey } from "@/lib/plans";

interface PlansProps {
  planId: string;
}

export const PlanCard = ({ planId }: PlansProps) => {
  const planKey = planId as PlanKey;
  const planContent = PLANS[planKey];

  if (!planContent) {
    return null;
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{planContent.name}</CardTitle>
        <CardDescription className="text-xs">{planContent.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="space-y-2">
          {planContent.features.map((feature: string) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full" variant="outline" disabled>
          Select Plan
        </Button>
      </CardContent>
    </Card>
  );
};