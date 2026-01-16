import { platforms } from "@/constants/platforms";
import { Database } from "@/types/database";

type SocialItemType = {
  platform: typeof platforms[number];
  integration: Database["public"]["Tables"]["platform_integrations"]["Row"];
}


export const SocialItem = ({platform, integration}: SocialItemType) => {

  console.log("Item:", platform, integration)

  const Icon = platform.icon;
  const isConnected = !!integration;

  return (
    <div className="flex items-center gap-3">
      <div className={`${platform.color} p-2.5 rounded-lg`}>
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{platform.name}</p>
        {isConnected && integration && (
          <p className="text-xs text-muted-foreground">
            @{integration.username}
          </p>
        )}
      </div>
    </div>
  );
};
