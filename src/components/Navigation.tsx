
import { Button } from "@/components/ui/button";
import { Share2, Settings, LogOut } from "lucide-react";

interface NavigationProps {
  onLogout: () => void;
}

const Navigation = ({ onLogout }: NavigationProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SocialPost</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
