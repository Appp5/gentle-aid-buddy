
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OAuthConfig {
  facebook: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
  };
  twitter: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
  };
  telegram: {
    botToken: string;
  };
  instagram: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
  };
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

    const { platform, action, code, state } = await req.json();

    console.log('Social auth request:', { platform, action, userId: user.id });

    // OAuth configuration
    const config: OAuthConfig = {
      facebook: {
        clientId: Deno.env.get('FACEBOOK_CLIENT_ID') || '',
        clientSecret: Deno.env.get('FACEBOOK_CLIENT_SECRET') || '',
        redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-auth`,
        scope: 'pages_manage_posts,pages_read_engagement,pages_show_list'
      },
      twitter: {
        clientId: Deno.env.get('TWITTER_CLIENT_ID') || '',
        clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET') || '',
        redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-auth`,
        scope: 'tweet.read tweet.write users.read'
      },
      telegram: {
        botToken: Deno.env.get('TELEGRAM_BOT_TOKEN') || ''
      },
      instagram: {
        clientId: Deno.env.get('INSTAGRAM_CLIENT_ID') || '',
        clientSecret: Deno.env.get('INSTAGRAM_CLIENT_SECRET') || '',
        redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-auth`,
        scope: 'instagram_basic,instagram_content_publish'
      }
    };

    if (action === 'connect') {
      // Generate OAuth URL
      let authUrl = '';
      
      switch (platform) {
        case 'facebook':
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
            `client_id=${config.facebook.clientId}&` +
            `redirect_uri=${encodeURIComponent(config.facebook.redirectUri)}&` +
            `scope=${config.facebook.scope}&` +
            `state=${user.id}_facebook&` +
            `response_type=code`;
          break;
          
        case 'twitter':
          authUrl = `https://twitter.com/i/oauth2/authorize?` +
            `response_type=code&` +
            `client_id=${config.twitter.clientId}&` +
            `redirect_uri=${encodeURIComponent(config.twitter.redirectUri)}&` +
            `scope=${encodeURIComponent(config.twitter.scope)}&` +
            `state=${user.id}_twitter&` +
            `code_challenge=challenge&` +
            `code_challenge_method=plain`;
          break;
          
        case 'instagram':
          authUrl = `https://api.instagram.com/oauth/authorize?` +
            `client_id=${config.instagram.clientId}&` +
            `redirect_uri=${encodeURIComponent(config.instagram.redirectUri)}&` +
            `scope=${config.instagram.scope}&` +
            `response_type=code&` +
            `state=${user.id}_instagram`;
          break;
          
        case 'telegram':
          // For Telegram, we'll use a different approach (bot-based)
          return new Response(
            JSON.stringify({ 
              message: 'Telegram integration requires bot setup',
              botUsername: 'YourBotUsername'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
      }

      return new Response(
        JSON.stringify({ authUrl }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (action === 'callback' && code) {
      // Handle OAuth callback
      const [userId, platformFromState] = state.split('_');
      
      if (userId !== user.id) {
        throw new Error('Invalid state parameter');
      }

      let tokenData;
      
      switch (platformFromState) {
        case 'facebook':
          // Exchange code for access token
          const fbTokenResponse = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?` +
            `client_id=${config.facebook.clientId}&` +
            `client_secret=${config.facebook.clientSecret}&` +
            `redirect_uri=${encodeURIComponent(config.facebook.redirectUri)}&` +
            `code=${code}`
          );
          
          const fbTokenData = await fbTokenResponse.json();
          
          if (fbTokenData.error) {
            throw new Error(fbTokenData.error.message);
          }

          // Get user's pages
          const pagesResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${fbTokenData.access_token}`
          );
          
          const pagesData = await pagesResponse.json();
          
          if (pagesData.data && pagesData.data.length > 0) {
            const page = pagesData.data[0]; // Use first page
            tokenData = {
              access_token: page.access_token,
              platform_user_id: page.id,
              platform_username: page.name,
              connection_data: { pages: pagesData.data }
            };
          }
          break;
          
        case 'twitter':
          // Exchange code for access token
          const twitterTokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${config.twitter.clientId}:${config.twitter.clientSecret}`)}`
            },
            body: new URLSearchParams({
              code,
              grant_type: 'authorization_code',
              client_id: config.twitter.clientId,
              redirect_uri: config.twitter.redirectUri,
              code_verifier: 'challenge'
            })
          });
          
          tokenData = await twitterTokenResponse.json();
          break;
          
        case 'instagram':
          // Exchange code for access token
          const igTokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              client_id: config.instagram.clientId,
              client_secret: config.instagram.clientSecret,
              grant_type: 'authorization_code',
              redirect_uri: config.instagram.redirectUri,
              code
            })
          });
          
          tokenData = await igTokenResponse.json();
          break;
      }

      if (tokenData) {
        // Store connection in database
        const { error: insertError } = await supabaseClient
          .from('social_connections')
          .upsert({
            user_id: user.id,
            platform: platformFromState,
            platform_user_id: tokenData.platform_user_id || tokenData.user_id || '',
            platform_username: tokenData.platform_username || tokenData.username || '',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: tokenData.expires_in ? 
              new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
            connection_data: tokenData.connection_data || {},
            is_active: true
          });

        if (insertError) {
          throw insertError;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error: any) {
    console.error('Social auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
