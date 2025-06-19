
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, Send, Image } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Platform {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

interface PostComposerProps {
  connectedPlatforms: Record<string, boolean>;
  platforms: Platform[];
  onPostSuccess?: () => void;
}

const PostComposer = ({ connectedPlatforms, platforms, onPostSuccess }: PostComposerProps) => {
  const [postContent, setPostContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({});
  const [isPosting, setIsPosting] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  const connectedPlatformsList = platforms.filter(p => connectedPlatforms[p.id]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };

  const handleImageUpload = () => {
    // Mock image upload for now
    setHasImage(!hasImage);
    toast.success(hasImage ? "Image removed" : "Image uploaded successfully!");
  };

  const handlePost = async () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content to post");
      return;
    }

    const selectedPlatformIds = Object.entries(selectedPlatforms)
      .filter(([_, selected]) => selected)
      .map(([platformId, _]) => platformId);

    if (selectedPlatformIds.length === 0) {
      toast.error("Please select at least one platform to post to");
      return;
    }

    setIsPosting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-post', {
        body: {
          content: postContent,
          platforms: selectedPlatformIds,
          imageUrl: hasImage ? 'mock-image-url' : null
        }
      });

      if (error) throw error;

      toast.success(`Post published to ${selectedPlatformIds.length} platform${selectedPlatformIds.length > 1 ? 's' : ''}!`);
      setPostContent("");
      setSelectedPlatforms({});
      setHasImage(false);
      onPostSuccess?.();
    } catch (error: any) {
      console.error('Post error:', error);
      toast.error(error.message || 'Failed to publish post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Create New Post</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Post Content */}
        <div className="space-y-2">
          <Label htmlFor="post-content">Post Content</Label>
          <Textarea
            id="post-content"
            placeholder="What's on your mind? Share it with your audience..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="min-h-32 resize-none"
          />
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{postContent.length} characters</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleImageUpload}
              className="flex items-center space-x-1"
            >
              <Upload className="h-4 w-4" />
              <span>{hasImage ? "Remove Image" : "Add Image"}</span>
            </Button>
          </div>
          {hasImage && (
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              <Image className="h-4 w-4" />
              <span>Image attached</span>
            </div>
          )}
        </div>

        {/* Platform Selection */}
        <div className="space-y-3">
          <Label>Select Platforms</Label>
          {connectedPlatformsList.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>Connect social media platforms to start posting</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {connectedPlatformsList.map((platform) => {
                const IconComponent = platform.icon;
                return (
                  <div 
                    key={platform.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Switch
                      id={platform.id}
                      checked={selectedPlatforms[platform.id] || false}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${platform.color}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <Label htmlFor={platform.id} className="flex-1 cursor-pointer">
                      {platform.name}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Post Button */}
        <Button 
          onClick={handlePost}
          disabled={isPosting || connectedPlatformsList.length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          size="lg"
        >
          {isPosting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Publishing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publish Post
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PostComposer;
