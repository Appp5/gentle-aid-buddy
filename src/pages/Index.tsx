
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Share2, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Instagram, 
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SocialPlatformCard from "@/components/SocialPlatformCard";
import PostComposer from "@/components/PostComposer";
import Navigation from "@/components/Navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  // Fetch user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch social connections
  const { data: connections = [], refetch: refetchConnections } = useQuery({
    queryKey: ['social-connections'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleConnectPlatform = async (platformId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('social-auth', {
        body: { platform: platformId, action: 'connect' }
      });
      
      if (error) throw error;
      
      // Redirect to OAuth URL
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect ${platformId}`);
    }
  };

  const connectedPlatforms = platforms.reduce((acc, platform) => {
    const connection = connections.find(conn => conn.platform === platform.id);
    acc[platform.id] = !!connection;
    return acc;
  }, {} as Record<string, boolean>);

  if (!user) {
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
      <Navigation onLogout={handleLogout} />
      
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
                isConnected={connectedPlatforms[platform.id]}
                onConnect={() => handleConnectPlatform(platform.id)}
              />
            ))}
          </div>
        </div>

        {/* Post Composer */}
        <PostComposer 
          connectedPlatforms={connectedPlatforms}
          platforms={platforms}
          onPostSuccess={() => {
            // Refresh any data if needed
            refetchConnections();
          }}
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
