
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Share2, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Instagram, 
  Upload,
  User,
  Settings,
  LogOut,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import SocialPlatformCard from "@/components/SocialPlatformCard";
import PostComposer from "@/components/PostComposer";
import Navigation from "@/components/Navigation";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    facebook: false,
    twitter: false,
    telegram: false,
    instagram: false
  });

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      description: 'Connect your Facebook page'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500',
      description: 'Connect your Twitter account'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: MessageCircle,
      color: 'bg-blue-500',
      description: 'Connect your Telegram channel'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: 'Connect your Instagram business account'
    }
  ];

  const handleLogin = () => {
    // Mock authentication
    setIsAuthenticated(true);
    toast.success("Successfully logged in with Google!");
  };

  const handleConnectPlatform = (platformId: string) => {
    setConnectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId as keyof typeof prev]
    }));
    
    const platform = platforms.find(p => p.id === platformId);
    toast.success(`${platform?.name} ${connectedPlatforms[platformId as keyof typeof connectedPlatforms] ? 'disconnected' : 'connected'}!`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Share2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Social Cross-Posting</CardTitle>
              <CardDescription className="text-base mt-2">
                Post to all your social media platforms from one place
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              size="lg"
            >
              <User className="h-5 w-5 mr-2" />
              Continue with Google
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation onLogout={() => setIsAuthenticated(false)} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your social media presence from one place</p>
        </div>

        {/* Connected Platforms Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Connected Platforms</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {Object.values(connectedPlatforms).filter(Boolean).length} / {platforms.length} connected
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((platform) => (
              <SocialPlatformCard
                key={platform.id}
                platform={platform}
                isConnected={connectedPlatforms[platform.id as keyof typeof connectedPlatforms]}
                onConnect={() => handleConnectPlatform(platform.id)}
              />
            ))}
          </div>
        </div>

        {/* Post Composer */}
        <PostComposer 
          connectedPlatforms={connectedPlatforms}
          platforms={platforms}
        />

        {/* Recent Posts */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Posts</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500 py-8">
                <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your recent posts will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
