import { platforms } from "@/constants/platforms";
import { Database } from "@/types/database";

type SocialItemType = {
  platform: typeof platforms[number];
  integration: Database["public"]["Tables"]["platform_integrations"]["Row"];
}


export const SocialItem = ({platform, integration}: SocialItemType) => {

  const Icon = platform.icon;
  const isConnected = !!integration;

  return (
    <div className="flex items-center gap-3">
      <div className={`${platform.color} flex items-center justify-center rounded-lg w-10 h-10 overflow-hidden`}>
        {integration?.profile_picture_url ? (
          <img className="w-10 h-10" src={integration.profile_picture_url}/>
        ) : (
          <Icon className="w-5 h-5 text-foreground" />
        )}
        
      </div>
      <div>
        <h4>{platform.name}</h4>
        {isConnected && integration && (
          <p className="mt-0 muted">
            @{integration.username}
          </p>
        )}
      </div>
    </div>
  );
};
