
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { content, platforms, imageUrl } = await req.json();

    console.log('Create post request:', { content, platforms, imageUrl, userId: user.id });

    // Get user's social connections
    const { data: connections, error: connectionsError } = await supabaseClient
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .in('platform', platforms)
      .eq('is_active', true);

    if (connectionsError) {
      throw connectionsError;
    }

    if (!connections || connections.length === 0) {
      throw new Error('No active connections found for selected platforms');
    }

    // Create post record
    const { data: postRecord, error: postError } = await supabaseClient
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl,
        platforms,
        status: 'pending'
      })
      .select()
      .single();

    if (postError) {
      throw postError;
    }

    // Post to each platform
    const results = [];
    const platformPostIds: Record<string, string> = {};
    const errors: Record<string, string> = {};

    for (const connection of connections) {
      try {
        let postResult;

        switch (connection.platform) {
          case 'facebook':
            postResult = await postToFacebook(connection, content, imageUrl);
            break;
          case 'twitter':
            postResult = await postToTwitter(connection, content, imageUrl);
            break;
          case 'telegram':
            postResult = await postToTelegram(connection, content, imageUrl);
            break;
          case 'instagram':
            postResult = await postToInstagram(connection, content, imageUrl);
            break;
          default:
            throw new Error(`Unsupported platform: ${connection.platform}`);
        }

        if (postResult.id) {
          platformPostIds[connection.platform] = postResult.id;
        }
        results.push({ platform: connection.platform, success: true, data: postResult });

      } catch (error: any) {
        console.error(`Error posting to ${connection.platform}:`, error);
        errors[connection.platform] = error.message;
        results.push({ platform: connection.platform, success: false, error: error.message });
      }
    }

    // Update post record with results
    const successCount = results.filter(r => r.success).length;
    let status = 'failed';
    if (successCount === results.length) {
      status = 'posted';
    } else if (successCount > 0) {
      status = 'partial';
    }

    await supabaseClient
      .from('posts')
      .update({
        status,
        platform_post_ids: platformPostIds,
        error_details: errors
      })
      .eq('id', postRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        postId: postRecord.id,
        status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Create post error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function postToFacebook(connection: any, content: string, imageUrl?: string) {
  const pageId = connection.platform_user_id;
  const accessToken = connection.access_token;

  const payload: any = {
    message: content,
    access_token: accessToken
  };

  if (imageUrl) {
    payload.link = imageUrl;
  }

  const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

async function postToTwitter(connection: any, content: string, imageUrl?: string) {
  const accessToken = connection.access_token;

  const payload: any = {
    text: content
  };

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

async function postToTelegram(connection: any, content: string, imageUrl?: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = connection.platform_user_id; // This should be the channel ID

  if (imageUrl) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: imageUrl,
        caption: content
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.description);
    }

    return result.result;
  } else {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: content
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.description);
    }

    return result.result;
  }
}

async function postToInstagram(connection: any, content: string, imageUrl?: string) {
  const accessToken = connection.access_token;
  const userId = connection.platform_user_id;

  if (!imageUrl) {
    throw new Error('Instagram posts require an image');
  }

  // Create media container
  const containerResponse = await fetch(
    `https://graph.instagram.com/v18.0/${userId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: accessToken
      })
    }
  );

  const containerResult = await containerResponse.json();
  
  if (containerResult.error) {
    throw new Error(containerResult.error.message);
  }

  // Publish the media
  const publishResponse = await fetch(
    `https://graph.instagram.com/v18.0/${userId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creation_id: containerResult.id,
        access_token: accessToken
      })
    }
  );

  const publishResult = await publishResponse.json();
  
  if (publishResult.error) {
    throw new Error(publishResult.error.message);
  }

  return publishResult;
}
