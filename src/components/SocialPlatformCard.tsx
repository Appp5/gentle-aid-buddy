
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Plus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

interface SocialPlatformCardProps {
  platform: Platform;
  isConnected: boolean;
  onConnect: () => void;
}

const SocialPlatformCard = ({ platform, isConnected, onConnect }: SocialPlatformCardProps) => {
  const IconComponent = platform.icon;
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${isConnected ? 'ring-2 ring-green-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.color}`}>
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          {isConnected && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-1">{platform.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{platform.description}</p>
        
        <Button 
          onClick={onConnect}
          variant={isConnected ? "outline" : "default"}
          size="sm"
          className="w-full"
        >
          {isConnected ? (
            <>Disconnect</>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Connect
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialPlatformCard;
